"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ToastState } from "@/components/ui/ToastBanner";
import { useAppContext } from "@/context/app-context";
import { userService, Usuario } from "@/lib/auth";
import { studyService } from "@/services/study-service";

export default function SettingsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/profile");
  }, [router]);
  return null;
}
