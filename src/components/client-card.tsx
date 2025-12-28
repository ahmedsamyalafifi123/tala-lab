"use client";

import { Client } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ClientCardProps {
  client: Client;
  onClick: (client: Client) => void;
}

export function ClientCard({ client, onClick }: ClientCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ar-EG", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:bg-accent/50"
      onClick={() => onClick(client)}
    >
      <CardContent className="p-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
          {client.daily_id}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate">{client.name}</h3>
            {client.category && (
              <Badge variant={client.category === "صحة مدرسية" ? "default" : "secondary"} className="text-xs shrink-0">
                {client.category === "صحة مدرسية" ? "صحة" : "CBC"}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {formatDate(client.client_date)}
            {client.notes && ` • ${client.notes}`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
