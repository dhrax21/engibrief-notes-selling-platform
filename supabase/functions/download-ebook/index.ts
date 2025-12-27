import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const auth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user } } = await auth.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: corsHeaders }
      );
    }

    const { ebookId } = await req.json();

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    /* =========================
       VERIFY PURCHASE
    ========================= */

    const { data: purchase } = await admin
      .from("purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("ebook_id", ebookId)
      .eq("payment_status", "paid")
      .maybeSingle();

    if (!purchase) {
      return new Response(
        JSON.stringify({ error: "Not purchased" }),
        { status: 403, headers: corsHeaders }
      );
    }

    /* =========================
       LOG DOWNLOAD  ✅ THIS WAS MISSING
    ========================= */

    const { error: logError } = await admin
      .from("download_logs")
      .insert({
        user_id: user.id,
        ebook_id: ebookId,
      });

    if (logError) {
      console.error("Download log insert failed:", logError);
    }

    /* =========================
       GET FILE + SIGNED URL
    ========================= */

    const { data: ebook } = await admin
      .from("ebooks")
      .select("pdf_path")
      .eq("id", ebookId)
      .single();

    const { data } = await admin.storage
      .from("ebooks")
      .createSignedUrl(ebook.pdf_path, 60);

    return new Response(
      JSON.stringify({ url: data.signedUrl }),
      { status: 200, headers: corsHeaders }
    );

  } catch (err) {
    console.error("download-ebook error:", err);
    return new Response(
      JSON.stringify({ error: "Download failed" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
