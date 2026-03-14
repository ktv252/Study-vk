"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { enrollBatch, UnenrollBatch } from "@/utils/api";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  UserCheck,
  CalendarCheck2,
  GraduationCap,
  BookmarkPlus,
  PinOff,
  Sparkles
} from "lucide-react";

export type BatchCardProps = {
  id?: string;
  title?: string;
  type?: string;
  image?: string;
  startDate?: string;
  endDate?: string;
  price?: string;
  forText?: string;
  isPlaceholder?: boolean;
  priority?: boolean;
};

export default function BatchCard({
  id = "",
  title = "",
  type = "",
  image,
  startDate = "",
  endDate = "",
  price = "",
  forText = "",
  isPlaceholder = false,
  priority = false,
}: BatchCardProps) {
  const router = useRouter();

  const [isEnrolled, setIsEnrolled] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const displayImage = image || "/assets/img/video-placeholder.svg";

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;

    const updateEnrollmentStatus = () => {
      const enrolledBatchesStr = localStorage.getItem("enrolledBatches") || "[]";
      try {
        const enrolledBatches = JSON.parse(enrolledBatchesStr) as { batchId: string }[];
        const enrolled = enrolledBatches.some((batch) => batch.batchId === id);
        setIsEnrolled(enrolled);
      } catch (e) {
        console.error("Failed to parse enrolledBatches", e);
      }
    };

    updateEnrollmentStatus();
    window.addEventListener("batchesUpdated", updateEnrollmentStatus);
    return () => window.removeEventListener("batchesUpdated", updateEnrollmentStatus);
  }, [id, hasMounted]);

  const handleEnroll = async () => {
    try {
      const res = await enrollBatch(id, title);
      if (res.success) {
        const enrolledBatchesStr = localStorage.getItem("enrolledBatches") || "[]";
        let enrolledBatches = JSON.parse(enrolledBatchesStr);
        if (!Array.isArray(enrolledBatches)) enrolledBatches = [];

        if (!enrolledBatches.some((batch: any) => batch.batchId === id)) {
          enrolledBatches.push({ batchId: id, name: title });
          localStorage.setItem("enrolledBatches", JSON.stringify(enrolledBatches));
          toast.success(`Enrolled in "${title}"`);
        }
        window.dispatchEvent(new Event("batchesUpdated"));
        setIsEnrolled(true);
      } else {
        toast.error(res.message || "Enrollment failed");
      }
    } catch (err) {
      toast.error("Enrollment error");
    }
  };

  const handleUnenroll = async () => {
    try {
      const res = await UnenrollBatch(id, title);
      if (res.success) {
        let enrolledBatches = JSON.parse(localStorage.getItem("enrolledBatches") || "[]");
        enrolledBatches = enrolledBatches.filter((batch: any) => batch.batchId !== id);
        localStorage.setItem("enrolledBatches", JSON.stringify(enrolledBatches));
        window.dispatchEvent(new Event("batchesUpdated"));
        setIsEnrolled(false);
        toast.success(`Unenrolled from "${title}"`);
      }
    } catch (err) {
      toast.error("Unenrollment error");
    }
  };

  if (isPlaceholder) {
    return (
      <div className="glass-card rounded-2xl p-4 space-y-4 animate-pulse">
        <div className="h-6 bg-white/5 rounded w-3/4" />
        <div className="h-48 bg-white/5 rounded-xl" />
        <div className="h-4 bg-white/5 rounded w-1/2" />
        <div className="flex gap-2">
          <div className="h-10 bg-white/5 rounded-xl w-1/2" />
          <div className="h-10 bg-white/5 rounded-xl w-1/2" />
        </div>
      </div>
    );
  }

  if (!hasMounted) return null;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      className="glass-card rounded-2xl overflow-hidden flex flex-col group"
    >
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={displayImage}
          alt={title}
          width={400}
          height={225}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          priority={priority}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
        <div className="absolute top-3 right-3">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-bold uppercase tracking-wider border border-purple-500/30 backdrop-blur-md">
            <Sparkles className="w-3 h-3" />
            {type || "Hinglish"}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-4 flex-grow flex flex-col">
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white line-clamp-2 leading-tight group-hover:text-purple-400 transition-colors">
            {title}
          </h3>
          <div className="flex items-center gap-2 text-gray-500 text-xs">
            <UserCheck className="w-3.5 h-3.5 text-purple-500" />
            <span className="font-medium">{forText}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-white/5 border border-white/5 mt-auto">
          <div className="flex items-center justify-between gap-2 text-[10px] text-gray-400">
            <div className="flex items-center gap-1.5">
              <CalendarCheck2 className="w-3 h-3" />
              <span>Starts: {startDate}</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-white/10" />
            <span>Ends: {endDate}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xl font-black text-green-400 tracking-tight">FREE</span>
            {price && <span className="text-[10px] text-gray-500 line-through">₹{price}</span>}
          </div>
          <div className="text-[10px] text-green-500/80 font-bold uppercase tracking-widest bg-green-500/10 px-2 py-1 rounded-md">
            Educational Offer
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-auto">
          <Button
            variant="ghost"
            className="rounded-xl border border-white/10 hover:bg-white/5 h-10 text-xs font-bold"
            onClick={() => router.push(`/study/batches/${id}`)}
          >
            <GraduationCap className="w-3.5 h-3.5 mr-2" />
            RESOURCES
          </Button>

          {isEnrolled ? (
            <Button
              className="rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 h-10 text-xs font-bold transition-all"
              onClick={handleUnenroll}
            >
              <PinOff className="w-3.5 h-3.5 mr-2" />
              UNENROLL
            </Button>
          ) : (
            <Button
              className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white shadow-lg shadow-purple-500/20 h-10 text-xs font-bold border-0"
              onClick={handleEnroll}
            >
              ENROLL NOW
              <BookmarkPlus className="w-3.5 h-3.5 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
