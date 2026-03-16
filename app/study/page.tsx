"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import BatchCard from "@/app/components/BatchCard";
import PromotionPopup from "@/app/components/PromotionPopup";

interface Button {
  Name: string;
  Link: string;
}

interface Promotion {
  title: string;
  message?: string;
  imageUrl?: string;
  button?: Button;
}

import {
  getEnrolledBatches,
  getTodaysSchedule,
  getUserDetailsList,
} from "@/utils/api";
import { toast } from "sonner";
import LiveClassCard from "@/app/components/LiveClassCard";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, ChevronRight, FileText } from "lucide-react";

type EnrolledBatch = { _id: string; batchId: string; name: string };

export default function Home() {
  const router = useRouter();
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [availableClasses, setAvailableClasses] = useState<EnrolledBatch[]>([]);
  const [schedule, setSchedule] = useState([]);
  const [pdfSchedule, setPdfSchedule] = useState([]);
  const [teacherMap, setTeacherMap] = useState<
    Record<string, { name: string; imageUrl: string }>
  >({});

  const [batchInfo, setBatchInfo] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const TgChannel = serverInfo?.tg_channel || process.env.NEXT_PUBLIC_TG;

  const promotion = {
    title: "Telegram Community !!",
    message: `Join The Channel For Latest Updates 👍 Don't miss any Future updates!`,
    imageUrl: "https://adsempire.com/blog/wp-content/uploads/adsempire/1132x670_AE_telegram_hid.png",
    button: { Name: "Join Now!", Link: TgChannel },
  };

  useEffect(() => {
    async function fetchServerInfo() {
      try {
        const res = await fetch("/api/auth/serverInfo");
        if (!res.ok) throw new Error("Failed to fetch server info");
        const data = await res.json();
        setServerInfo(data);
      } catch (err) {
        setError("Could not load server info");
      } finally {
        setLoading(false);
      }
    }
    fetchServerInfo();
  }, []);

  const OpenTelegramChannel = () => {
    if (TgChannel) window.open(TgChannel, "_blank");
  };

  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
  };

  const onMouseUp = () => {
    setIsDragging(false);
  };

  const onMouseLeave = () => {
    setIsDragging(false);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 1; // scroll speed factor
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const [selectedClass, setSelectedClass] = useState<EnrolledBatch>({
    _id: "",
    batchId: "",
    name: "Select Batch",
  });

  const fetchTodaysSchedule = async (batchId: string) => {
    try {
      // Step 1: Fetch today's schedule for batch
      const scheduleRes = await getTodaysSchedule(batchId);
      const scheduleData = scheduleRes.data || [];

      // ✅ Filter video lectures and PDFs separately
      const videoSchedule = scheduleData.filter(
        (item: any) =>
          item.isVideoLecture === true ||
          item.isLive === true ||
          ["awsVideo", "vimeo", "penpencilvdo", "youtube"].includes(item.urlType) ||
          item.tag?.toUpperCase() === "LIVE"
      );

      const pdfScheduleData = scheduleData.filter((item: any) => {
        const hasAttachment = (item.attachments && item.attachments.length > 0) ||
          (item.homeworkIds && item.homeworkIds[0]?.attachmentIds?.length > 0);
        return !item.isVideoLecture && hasAttachment;
      });

      // Step 2: Extract all unique teacher IDs from videos
      const teacherIdSet = new Set<string>();
      videoSchedule.forEach((item: any) => {
        if (Array.isArray(item.teachers) && item.teachers.length > 0) {
          item.teachers.forEach((id: string) => teacherIdSet.add(id));
        }
      });
      const uniqueTeacherIds = Array.from(teacherIdSet);

      // Step 3: Fetch teacher details if any
      let teacherList: any[] = [];
      if (uniqueTeacherIds.length > 0) {
        const teacherRes = await getUserDetailsList(uniqueTeacherIds);
        teacherList = teacherRes.data || [];
      }

      // Step 4: Create teacherId -> { name, imageUrl } map
      const teacherMapTemp: Record<string, { name: string; imageUrl: string }> =
        {};

      teacherList.forEach((teacher: any) => {
        teacherMapTemp[teacher._id] = {
          name: teacher.name,
          imageUrl: teacher.imageId
            ? `${teacher.imageId.baseUrl}${teacher.imageId.key}`
            : "/assets/img/teacher-placeholder.png",
        };
      });

      // Step 5: Handle fallback for lectures with no teachers
      videoSchedule.forEach((item: any) => {
        const hasTeachers =
          Array.isArray(item.teachers) && item.teachers.length > 0;

        if (!hasTeachers && item.videoDetails?.image) {
          const fallbackId = item._id;
          teacherMapTemp[fallbackId] = {
            name: "",
            imageUrl: item.videoDetails.image,
          };
        }
      });

      // Step 6: Update state
      setSchedule(videoSchedule);
      setPdfSchedule(pdfScheduleData);
      setTeacherMap(teacherMapTemp);
      setErrorMsg("");
    } catch (err: any) {
      let message = "Failed to fetch today's schedule.";
      if (err?.message?.includes("401") || err?.message?.toLowerCase().includes("unauthorized")) {
        message = "You are not authorized. Please log in again.";
      } else if (err?.message) {
        message = err.message;
      }
      setErrorMsg(message);
      setSchedule([]);
      setPdfSchedule([]);
      setTeacherMap({});
    }
  };

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const data = await getEnrolledBatches();
        const fetchedBatches = data.enrolledBatches || [];

        setAvailableClasses(fetchedBatches);
        localStorage.setItem("enrolledBatches", JSON.stringify(fetchedBatches));
        localStorage.setItem("USER_DATA", JSON.stringify(data.user));

        const savedSelectionRaw = localStorage.getItem("selectedBatch");
        let finalSelectedBatch = fetchedBatches[0] || {
          _id: "",
          batchId: "",
          name: "Select Batch",
        };

        if (savedSelectionRaw && savedSelectionRaw !== "undefined") {
          try {
            const savedSelection = JSON.parse(savedSelectionRaw);
            const found = fetchedBatches.find(
              (batch: EnrolledBatch) => batch._id === savedSelection._id
            );
            if (found) finalSelectedBatch = found;
          } catch (e) {
            finalSelectedBatch = fetchedBatches[0];
          }
        }

        setSelectedClass(finalSelectedBatch);
        localStorage.setItem("selectedBatch", JSON.stringify(finalSelectedBatch));

        if (finalSelectedBatch.batchId) {
          fetchTodaysSchedule(finalSelectedBatch.batchId);
        }
      } catch (err: any) {
        if (err.response?.status === 401) {
          toast.error("Unauthorized: Please login again.");
        } else {
          toast.error("Failed to load enrolled batches");
        }
        setAvailableClasses([]);
        setSelectedClass({ _id: "", batchId: "", name: "Select Batch" });
      }
    };

    fetchBatches();
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 max-w-[1400px]">
      {/* Search/Batch Selection */}
      <div className="bg-background border rounded-lg p-4 sm:p-6 mb-6 divshadow">
        <div className="flex flex-wrap sm:flex-row justify-between items-start sm:items-center mb-4 gap-4 outline-none">
          <div className="flex items-center gap-2 w-full sm:w-auto border rounded-md">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full sm:w-auto justify-between text-left outline-none">
                  <span className="truncate">{selectedClass.name}</span>
                  <ChevronDown className="w-5 h-5 ml-2 flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-full">
                {availableClasses.map((cls) => (
                  <DropdownMenuItem
                    className="border-b p-2 m-1 outline-none"
                    key={cls?._id}
                    onClick={() => {
                      setSelectedClass(cls);
                      localStorage.setItem("selectedBatch", JSON.stringify(cls));
                      fetchTodaysSchedule(cls.batchId);
                    }}
                  >
                    {cls.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Classes Section */}
        <div className="mb-4">
          <h3 className="text-md font-medium mb-2">Today's Class</h3>
          <div className="rounded-lg p-3">
            {errorMsg && <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-center">{errorMsg}</div>}
            <div
              ref={scrollRef}
              className={`flex gap-4 overflow-x-auto whitespace-nowrap ${schedule.length > 0 ? "cursor-grab select-none" : ""
                }`}
              style={{ scrollBehavior: "smooth" }}
              onMouseDown={schedule.length > 0 ? onMouseDown : undefined}
              onMouseUp={schedule.length > 0 ? onMouseUp : undefined}
              onMouseLeave={schedule.length > 0 ? onMouseLeave : undefined}
              onMouseMove={schedule.length > 0 ? onMouseMove : undefined}
            >
              {schedule.length === 0 ? (
                <div className="bg-[#7e7e7e29] rounded-lg p-6 sm:p-8 text-center text-foreground w-full">
                  Classes not Scheduled yet
                </div>
              ) : (
                schedule.map((cls: any, idx: number) => {
                  const teacherId = cls.teachers?.[0];
                  const teacher = teacherMap[teacherId] || teacherMap[cls._id];
                  const teacherName = teacher?.name || "";
                  const teacherImage = teacher?.imageUrl;

                  const startTime = new Date(cls.startTime);
                  const endTime = new Date(cls.endTime);
                  const now = new Date();

                  const isBefore = now < startTime;
                  const isDuring = now >= startTime && now <= endTime;
                  const isAfter = now > endTime;

                  const hoursLeft = Math.floor((startTime.getTime() - now.getTime()) / (1000 * 60 * 60));
                  const minutesLeft = Math.floor(((startTime.getTime() - now.getTime()) / (1000 * 60)) % 60);

                  const handleClick = () => {
                    const { batchId, subjectId, _id: childId, urlType } = cls;
                    const subjectIdStr = typeof subjectId === "string" ? subjectId : subjectId?._id;

                    if (urlType === "vimeo" || (urlType === "awsVideo" && isBefore)) {
                      if (startTime > now) {
                        toast.error(`Upcoming live class in ${hoursLeft > 0 ? `${hoursLeft}h ` : ""}${minutesLeft}m`);
                      } else {
                        toast.error("This class has not started yet. Try refreshing...");
                      }
                    } else if (urlType === "penpencilvdo") {
                      router.push(`/watch?batchId=${batchId}&SubjectId=${subjectIdStr}&ChildId=${childId}&Type=penpencilvdo&isLocked=false`);
                    } else if (urlType === "awsVideo") {
                      if (isDuring) {
                        router.push(`/live?batchId=${batchId}&SubjectId=${subjectIdStr}&ChildId=${childId}&Type=awsVideo`);
                      } else if (isAfter) {
                        // Redirect to recording
                        router.push(`/watch?batchId=${batchId}&SubjectId=${subjectIdStr}&ChildId=${childId}&Type=penpencilvdo&isLocked=false`);
                      }
                    }
                  };

                  return (
                    <LiveClassCard
                      key={cls._id}
                      teacherName={teacherName}
                      teacherImage={teacherImage}
                      subject={cls.subjectId?.name || "Subject"}
                      lectureTitle={cls.topic || cls.videoDetails?.name || "Untitled Lecture"}
                      startTime={startTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      tag={cls.tag}
                      onClick={handleClick}
                      priority={idx === 0}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* PDFs Section (Dedicated as requested) */}
        {pdfSchedule.length > 0 && (
          <div className="mb-4 mt-8">
            <h3 className="text-md font-medium mb-2">Today's PDFs</h3>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {pdfSchedule.map((pdf: any) => (
                <div key={pdf._id} className="bg-background border rounded-lg p-4 min-w-[240px] shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-indigo-600">
                      <FileText size={20} />
                      <span className="text-xs font-bold uppercase tracking-wider">Document</span>
                    </div>
                    <h4 className="font-semibold text-foreground line-clamp-2 mb-1">{pdf.topic || pdf.name || "Lecture Note"}</h4>
                    <p className="text-sm text-muted-foreground">{pdf.subjectId?.name || "Subject"}</p>
                  </div>
                  <Button
                    onClick={() => {
                        const attachment = pdf.attachments?.[0] || pdf.homeworkIds?.[0]?.attachmentIds?.[0];
                        if (attachment?.baseUrl && attachment?.key) {
                          window.open(attachment.baseUrl + attachment.key, "_blank");
                        } else {
                          toast.error("PDF not available");
                        }
                    }}
                    className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Open PDF
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-center mt-6">
          <Button
            className="flex items-center gap-2"
            onClick={() => {
              if (selectedClass.batchId) {
                router.push(`/study/batches/${selectedClass.batchId}`);
              } else {
                toast.error("You haven't enrolled in any batches!!");
              }
            }}
          >
            View All Classes
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Community Section */}
      <div className="bg-background border rounded-lg p-4 sm:p-6 mb-6 divshadow text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-xl font-semibold">Join Our Community 🚀</h2>
            <p className="text-muted-foreground">
              Join our Telegram channel to receive the latest updates 📢 and batch information 📚
            </p>
          </div>
          <Button className="flex items-center gap-2 px-8" onClick={() => OpenTelegramChannel()}>
            Join Telegram Channel
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <PromotionPopup promotion={promotion} />
    </div>
  );
}
