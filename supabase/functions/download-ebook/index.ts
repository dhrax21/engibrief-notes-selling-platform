import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { ebookId, userId, filePath } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: purchase } = await supabase
      .from("purchases")
      .select("id")
      .eq("ebook_id", ebookId)
      .eq("user_id", userId)
      .eq("status", "SUCCESS")
      .single();

    if (!purchase) {
      return new Response(
        JSON.stringify({ error: "Not purchased" }),
        { status: 403, headers: corsHeaders }
      );
    }

    await supabase.from("download_logs").insert({
      user_id: userId,
      ebook_id: ebookId,
    });

    const { data } = await supabase.storage
      .from("ebooks")
      .createSignedUrl(filePath, 60);

    return new Response(JSON.stringify({ url: data.signedUrl }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: "Download failed" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
