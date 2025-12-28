"use client";

import { Client } from "@/types";
import { Card } from "@/components/ui/card";

interface ClientCardProps {
  client: Client;
  onClick: (client: Client) => void;
}

export function ClientCard({ client, onClick }: ClientCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getCategoryBadge = (category: string | null) => {
    if (!category) return null;
    
    const isHealth = category === "صحة مدرسية";
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium text-white ${
          isHealth ? "badge-health" : "badge-cbc"
        }`}
      >
        {category}
      </span>
    );
  };

  return (
    <Card
      className="p-4 glass border-0 rounded-2xl card-interactive cursor-pointer"
      onClick={() => onClick(client)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full gradient-btn flex items-center justify-center text-white font-bold text-lg">
            {client.daily_id}
          </div>
          <div>
            <h3 className="font-semibold text-lg">{client.name}</h3>
            <p className="text-sm text-muted-foreground">
              {formatDate(client.client_date)}
            </p>
          </div>
        </div>
        {getCategoryBadge(client.category)}
      </div>
      {client.notes && (
        <p className="mt-3 text-sm text-muted-foreground line-clamp-2 pe-16">
          {client.notes}
        </p>
      )}
    </Card>
  );
}
