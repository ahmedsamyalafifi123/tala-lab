import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

/**
 * Renders a full print document (the exact HTML the print buttons open) into
 * a real PDF with headless Chrome — the same engine and output as printing,
 * so the text stays selectable/searchable and the layout is identical.
 * The client sends the ready HTML; this route only turns it into PDF bytes.
 */

export const runtime = "nodejs";
// Cold start must unpack Chromium, launch it and render — well over 10s.
export const maxDuration = 60;
export const memory = "2048";

let browserPromise: Promise<any> | null = null;

/** Locally installed Chrome for dev (puppeteer cache or system install). */
function findLocalChrome(): string | null {
  const cacheRoot = join(homedir(), ".cache", "puppeteer", "chrome");
  try {
    const { readdirSync } = require("fs") as typeof import("fs");
    for (const version of readdirSync(cacheRoot)) {
      for (const platform of readdirSync(join(cacheRoot, version))) {
        const candidates = [
          join(cacheRoot, version, platform, "chrome-linux64", "chrome"),
          join(cacheRoot, version, platform, "chrome-linux", "chrome"),
        ];
        for (const candidate of candidates) {
          if (existsSync(candidate)) return candidate;
        }
      }
    }
  } catch {
    // no puppeteer cache — fall through to system paths
  }
  for (const candidate of [
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ]) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = (async () => {
      const puppeteer = (await import("puppeteer-core")).default;
      const localChrome = findLocalChrome();
      if (localChrome) {
        return puppeteer.launch({
          executablePath: localChrome,
          args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
        });
      }
      // Serverless (Vercel): no local Chrome exists — use the packaged one.
      const chromium = (await import("@sparticuz/chromium")).default;
      return puppeteer.launch({
        executablePath: await chromium.executablePath(),
        args: [...chromium.args, "--disable-dev-shm-usage", "--no-sandbox"],
        headless: "shell",
      });
    })().catch((error) => {
      browserPromise = null;
      throw error;
    });
  }
  return browserPromise;
}

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
