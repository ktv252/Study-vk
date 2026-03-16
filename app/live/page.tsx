"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";

const HLSPlayer = dynamic(() => import("@/app/components/HLSPlayer"), {
  ssr: false,
});

export default function LivePage() {
  const [url, seturl] = useState<string | null>(null);
  const [signedUrl, setsignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  const [lectureTitle, setLectureTitle] = useState<string>("");
  const [attachment, setAttachment] = useState<any>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const batchId = params.get("batchId");
    const subjectId = params.get("SubjectId");
    const childId = params.get("ChildId");

    if (!batchId || !subjectId || !childId) {
      const err = "Missing required query parameters.";
      toast.error(err);
      setErrorMsg(err);

      setLoading(false);
      return;
    }

    const promise = toast.promise(
      fetch(
        `/api/get-video-url?batchId=${batchId}&subjectId=${subjectId}&childId=${childId}&videoContainerType=HLS`
      ).then(async (res) => {
        const data = await res.json();

        // Handle Verification
        if (res.status === 402 || data.verificationRequired) {
          setVerificationUrl(data.verificationUrl || "/api/shortner/generate");
          // Don't throw error, just handle verify UI
          return data;
        }

        if (!data.success) {
          throw new Error(
            data.message || "Failed to fetch video EROR_CODE_902"
          );
        }
        const videoData = data.data; // ✅ use the inner data object

        if (!videoData.url || !videoData.signedUrl) {
          throw new Error("Invalid video URL response from server");
        }

        seturl(videoData.url);
        setsignedUrl(videoData.signedUrl);

        // Fetch Schedule for Topic/Title
        try {
          const scheduleRes = await fetch(
            `/api/Schedule?BatchId=${batchId}&SubjectId=${subjectId}&ContentId=${childId}`
          );
          const scheduleData = await scheduleRes.json();
          if (scheduleData?.success && scheduleData?.data) {
            setLectureTitle(
              scheduleData.data.topic ||
                scheduleData.data.videoDetails?.name ||
                ""
            );
            
            const homeworkIds = scheduleData?.data?.homeworkIds?.[0];
            if (homeworkIds?.attachmentIds?.length > 0) {
              const attach = homeworkIds.attachmentIds[0];
              if (attach?.baseUrl && attach?.key) {
                setAttachment(attach);
              }
            }
          }
        } catch (scheduleErr) {
          console.error("Failed to fetch schedule for title:", scheduleErr);
        }

        return data;
      }),
      {
        loading: "Loading video link...",
        success: (data) => {
          if (data.verificationRequired) return "Verification required";
          return "Video link loaded!";
        },
        error: (err) => {
          setErrorMsg(err.message || "Error loading video link");
          return err.message || "Error loading video link";
        },
      }
    );

    // unwrap returns a real Promise so you can use finally()
    promise.unwrap().finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-white">
        <span>Loading video...</span>
      </div>
    );
  }

  if (verificationUrl) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4 text-center z-50">
        <h1 className="text-2xl font-bold mb-4">Verification Required</h1>
        <p className="mb-6 max-w-md text-gray-300">
          To continue watching, you must complete a quick verification step. Access will be granted for 36 hours.
        </p>
        <button
          onClick={async () => {
            const toastId = toast.loading("Generating link...");
            try {
              const res = await fetch(verificationUrl);
              const d = await res.json();
              if (d.url) {
                window.location.href = d.url;
              } else if (d.verified) {
                toast.success("Already verified! Reloading...");
                window.location.reload();
              } else {
                toast.error("Failed to generate link");
              }
            } catch (e) {
              toast.error("Error generating link");
            } finally {
              toast.dismiss(toastId);
            }
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-semibold transition"
        >
          Verify Access
        </button>
      </div>
    );
  }

  if (errorMsg || !url || !signedUrl) {
    return (
      <div className="text-red-500 text-center p-4">
        <p>{errorMsg || "Unknown error occurred."}</p>
      </div>
    );
  }

  return <HLSPlayer baseUrl={url} signedQuery={signedUrl} Attachment={attachment} lectureTitle={lectureTitle} />;
}
