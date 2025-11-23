"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TalksPage() {
  const [talks, setTalks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/talks")
      .then((res) => res.json())
      .then((data) => {
        setTalks(data.talks || []);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to fetch talks");
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>All User Talks</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : talks.length === 0 ? (
            <p>No talks found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border">
                <thead>
                  <tr>
                    <th className="border px-2 py-1">Phone</th>
                    <th className="border px-2 py-1">Question</th>
                    <th className="border px-2 py-1">AI Response</th>
                    <th className="border px-2 py-1">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {talks.map((talk, i) => (
                    <tr key={i} className="border-b">
                      <td className="border px-2 py-1">{talk.user_phone_number}</td>
                      <td className="border px-2 py-1">{talk.user_transcript}</td>
                      <td className="border px-2 py-1">{talk.ai_response}</td>
                      <td className="border px-2 py-1">{new Date(talk.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
