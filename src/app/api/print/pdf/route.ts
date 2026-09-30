import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

/**
 * Renders a full print document (the exact HTML the print buttons open) into
 * a real PDF with headless Chrome — the same engine and output as printing,
 * so the text stays selectable/searchable and the layout is identical.
 * The client sends the ready HTML; this route only turns it into PDF bytes.
 */

let browserPromise: Promise<any> | null = null;

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = (async () => {
      const puppeteer = (await import("puppeteer")).default;
      // Vercel serverless has no Chrome and no puppeteer download cache:
      // use the serverless-packaged Chromium instead. Locally, puppeteer's
      // own bundled Chromium works out of the box.
      if (process.env.VERCEL) {
        const chromium = (await import("@sparticuz/chromium")).default;
        chromium.setGraphicsMode = false; // PDF needs no GPU
        return puppeteer.launch({
          executablePath: await chromium.executablePath(),
          args: [...chromium.args, "--disable-dev-shm-usage"],
          headless: "shell",
        });
      }
      return puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
      });
    })().catch((error) => {
      browserPromise = null;
      throw error;
    });
  }
  return browserPromise;
}

// Headless launch + PDF rendering can exceed Vercel's default 10s.
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { html, origin, waitForReadyFlag } = await req.json();
    if (!html || typeof html !== "string" || !origin || !/^https?:\/\//.test(origin)) {
      return NextResponse.json({ error: "Missing or invalid html/origin" }, { status: 400 });
    }

    // Headless Chrome loads the HTML from about:blank, so same-origin asset
    // URLs (logo, Cairo font) must be made absolute before rendering.
    const safeOrigin = origin.replace(/\/$/, "");
    const absoluteHtml = html
      .replace(/(src|href)=("|')\//g, `$1=$2${safeOrigin}/`)
      .replace(/url\((['"]?)\//g, (_match, quote) => `url(${quote}${safeOrigin}/`);

    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
      await page.setContent(absoluteHtml, { waitUntil: "networkidle0", timeout: 30000 });
      if (waitForReadyFlag) {
        // The detailed sheet paginates itself and raises this flag when done.
        await page
          .waitForFunction("window.__detailsPrintReady === true", { timeout: 8000 })
          .catch(() => {});
      }
      await page.evaluate(() => (document as any).fonts?.ready).catch(() => {});
      await new Promise((resolve) => setTimeout(resolve, 300));

      const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
      return new NextResponse(Buffer.from(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Cache-Control": "no-store",
        },
      });
    } finally {
      await page.close();
    }
  } catch (error: any) {
    console.error("Error rendering print PDF:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to render PDF" },
      { status: 500 }
    );
  }
}
