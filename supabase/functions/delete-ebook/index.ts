import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    /* =========================
       AUTH USER
    ========================= */

    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: {
            Authorization: req.headers.get("Authorization")!,
          },
        },
      }
    );

    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: corsHeaders }
      );
    }

    /* =========================
       ADMIN CHECK
    ========================= */

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: corsHeaders }
      );
    }

    /* =========================
       INPUT
    ========================= */

    const { ebookId } = await req.json();
    if (!ebookId) {
      return new Response(
        JSON.stringify({ error: "ebookId required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    /* =========================
       FETCH FILE PATH
    ========================= */

    const { data: ebook } = await admin
      .from("ebooks")
      .select("pdf_path")
      .eq("id", ebookId)
      .single();

    /* =========================
       SOFT DELETE (DB)
    ========================= */

    const { error } = await admin
      .from("ebooks")
      .update({ is_active: false })
      .eq("id", ebookId);

    if (error) throw error;

    /* =========================
       OPTIONAL: DELETE FILE
    ========================= */

    if (ebook?.pdf_path) {
      await admin.storage
        .from("ebooks")
        .remove([ebook.pdf_path]);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: corsHeaders }
    );

  } catch (err) {
    console.error("delete-ebook error:", err);
    return new Response(
      JSON.stringify({ error: "Delete failed" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
