"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@awssbg/shared";
import OrgBlogClient from "./OrgBlogClient";

export function generateStaticParams() {
  return [{ org: "tut" }];
}

export default function OrgBlogPage() {
  const router = useRouter();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    async function checkOrgs() {
      try {
        const { data: orgs } = await supabase.from("orgs").select("id");
        if (!orgs || orgs.length <= 1) {
          router.replace("/blog");
        } else {
          setShouldRender(true);
        }
      } catch {
        setShouldRender(true);
      }
    }
    checkOrgs();
  }, [router]);

  if (!shouldRender) return null;
  return <OrgBlogClient />;
}
