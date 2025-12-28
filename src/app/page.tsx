"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase";
import { Client } from "@/types";
import { fuzzyMatchArabic, getMatchScore } from "@/lib/arabic-utils";
import { ClientSearch } from "@/components/client-search";
import { ClientCard } from "@/components/client-card";
import { ClientModal } from "@/components/client-modal";
import { ClientDetails } from "@/components/client-details";
import { BottomNav } from "@/components/bottom-nav";

export default function Home() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    checkUser();
    fetchClients();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser({ id: user.id, email: user.email || "" });
    } else {
      window.location.href = "/login";
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("client_date", { ascending: false })
        .order("daily_id", { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;

    return clients
      .filter((client) => fuzzyMatchArabic(searchQuery, client.name))
      .sort((a, b) => {
        const scoreA = getMatchScore(searchQuery, a.name);
        const scoreB = getMatchScore(searchQuery, b.name);
        return scoreB - scoreA;
      });
  }, [clients, searchQuery]);

  const handleSave = async (data: { name: string; notes: string; category: string | null }) => {
    setIsSaving(true);
    try {
      if (editingClient) {
        // Update existing client
        const { error } = await supabase
          .from("clients")
          .update({
            name: data.name,
            notes: data.notes || null,
            category: data.category,
            updated_at: new Date().toISOString(),
            updated_by: user?.id,
          })
          .eq("uuid", editingClient.uuid);

        if (error) throw error;

        // Log audit
        await supabase.from("audit_log").insert({
          table_name: "clients",
          record_id: editingClient.uuid,
          action: "UPDATE",
          old_data: editingClient,
          new_data: { ...editingClient, ...data },
          user_id: user?.id,
          user_email: user?.email,
        });
      } else {
        // Insert new client
        const { data: newClient, error } = await supabase
          .from("clients")
          .insert({
            name: data.name,
            notes: data.notes || null,
            category: data.category,
            created_by: user?.id,
            updated_by: user?.id,
          })
          .select()
          .single();

        if (error) throw error;

        // Log audit
        if (newClient) {
          await supabase.from("audit_log").insert({
            table_name: "clients",
            record_id: newClient.uuid,
            action: "INSERT",
            new_data: newClient,
            user_id: user?.id,
            user_email: user?.email,
          });
        }
      }

      await fetchClients();
      setShowAddModal(false);
      setEditingClient(null);
    } catch (error) {
      console.error("Error saving client:", error);
      alert("حدث خطأ أثناء الحفظ");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (client: Client) => {
    setIsDeleting(true);
    try {
      // Log audit before delete
      await supabase.from("audit_log").insert({
        table_name: "clients",
        record_id: client.uuid,
        action: "DELETE",
        old_data: client,
        user_id: user?.id,
        user_email: user?.email,
      });

      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("uuid", client.uuid);

      if (error) throw error;

      await fetchClients();
      setShowDetails(false);
      setSelectedClient(null);
    } catch (error) {
      console.error("Error deleting client:", error);
      alert("حدث خطأ أثناء الحذف");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
    setShowDetails(true);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setShowAddModal(true);
  };

  const handleAddClick = () => {
    setEditingClient(null);
    setShowAddModal(true);
  };

  const todayClients = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return clients.filter((c) => c.client_date === today).length;
  }, [clients]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-btn animate-pulse" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-24 page-transition">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Logo"
                width={48}
                height={48}
                className="rounded-xl"
              />
              <div>
                <h1 className="text-lg font-bold gradient-text">حالات معمل عيادة تلا</h1>
                <p className="text-xs text-muted-foreground">
                  {todayClients} حالة اليوم • {clients.length} إجمالي
                </p>
              </div>
            </div>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/login";
              }}
              className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
          <ClientSearch onSearch={setSearchQuery} />
        </div>
      </header>

      {/* Client List */}
      <div className="px-4 py-4 space-y-3">
        {filteredClients.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-secondary/50 flex items-center justify-center">
              <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-muted-foreground text-lg">
              {searchQuery ? "لا توجد نتائج" : "لا توجد حالات بعد"}
            </p>
            {!searchQuery && (
              <p className="text-sm text-muted-foreground mt-2">
                اضغط على الزر + لإضافة حالة جديدة
              </p>
            )}
          </div>
        ) : (
          filteredClients.map((client) => (
            <ClientCard key={client.uuid} client={client} onClick={handleClientClick} />
          ))
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav onAddClick={handleAddClick} />

      {/* Add/Edit Modal */}
      <ClientModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingClient(null);
        }}
        onSave={handleSave}
        client={editingClient}
        isLoading={isSaving}
      />

      {/* Client Details */}
      <ClientDetails
        client={selectedClient}
        isOpen={showDetails}
        onClose={() => {
          setShowDetails(false);
          setSelectedClient(null);
        }}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />
    </main>
  );
}
