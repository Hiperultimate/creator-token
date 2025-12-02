import { useState, useCallback } from "react";
import { Post } from "@/types/anchor";
import axios from "axios";
import { toast } from "sonner";

type PostType = "text" | "image" | "video";

interface UseCreatePostOptions {
  creatorAddress: string;
  onPostCreated?: (post: Post) => void;
}

interface UseCreatePostReturn {
  // Form state
  postContent: string;
  setPostContent: (content: string) => void;
  postType: PostType;
  setPostType: (type: PostType) => void;
  postFile: File | null;
  setPostFile: (file: File | null) => void;
  postRequiredTokens: string;
  setPostRequiredTokens: (tokens: string) => void;
  filePreview: string | null;

  // Dialog state
  showCreatePost: boolean;
  setShowCreatePost: (show: boolean) => void;

  // Actions
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCreatePost: () => Promise<void>;
  resetForm: () => void;

  // Loading state
  isCreatingPost: boolean;
}

export function useCreatePost({
  creatorAddress,
  onPostCreated,
}: UseCreatePostOptions): UseCreatePostReturn {
  // Dialog state
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);

  // Form state
  const [postContent, setPostContent] = useState("");
  const [postType, setPostType] = useState<PostType>("text");
  const [postFile, setPostFile] = useState<File | null>(null);
  const [postRequiredTokens, setPostRequiredTokens] = useState("0");
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setPostContent("");
    setPostType("text");
    setPostFile(null);
    setFilePreview(null);
    setPostRequiredTokens("0");
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setPostFile(file);
        // Create preview for images
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (e) => setFilePreview(e.target?.result as string);
          reader.readAsDataURL(file);
        } else if (file.type.startsWith("video/")) {
          const url = URL.createObjectURL(file);
          setFilePreview(url);
        }
      }
    },
    []
  );

  const handleCreatePost = useCallback(async () => {
    if (!postContent.trim()) return;

    setIsCreatingPost(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/creator/post`,
        {
          content: postContent,
          tokenThreshold: Number(postRequiredTokens),
        },
        { withCredentials: true }
      );

      const { post: createdPost } = response.data;

      // Map backend response to frontend Post type
      // Not accepting image and video types for now
      const newPost: Post = {
        id: createdPost.id,
        creatorAddress: createdPost.creatorAddress,
        content: createdPost.contentUrl,
        requiredTokens: Number(createdPost.tokenThreshold),
        createdAt: new Date(createdPost.createdAt),
        type: "text",
      };

      // Call the callback to add the post to the list
      onPostCreated?.(newPost);

      // Reset form and close dialog
      resetForm();
      setShowCreatePost(false);

      toast.success("Post created successfully!");
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast.error(
        error.response?.data?.error || "Failed to create post. Please try again."
      );
    } finally {
      setIsCreatingPost(false);
    }
  }, [postContent, postRequiredTokens, onPostCreated, resetForm]);

  const handleSetShowCreatePost = useCallback(
    (show: boolean) => {
      setShowCreatePost(show);
      if (!show) {
        resetForm();
      }
    },
    [resetForm]
  );

  return {
    // Form state
    postContent,
    setPostContent,
    postType,
    setPostType,
    postFile,
    setPostFile,
    postRequiredTokens,
    setPostRequiredTokens,
    filePreview,

    // Dialog state
    showCreatePost,
    setShowCreatePost: handleSetShowCreatePost,

    // Actions
    handleFileChange,
    handleCreatePost,
    resetForm,

    // Loading state
    isCreatingPost,
  };
}

