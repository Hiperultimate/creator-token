import { useState, useEffect, useRef, useCallback } from "react";
import { Post } from "@/types/anchor";
import axios from "axios";
import { toast } from "sonner";

interface UseCreatorPostsOptions {
  creatorAddress: string | undefined;
  isAuthenticated: boolean;
  limit?: number;
}

interface UseCreatorPostsReturn {
  posts: Post[];
  isLoadingPosts: boolean;
  isLoadingMore: boolean;
  hasNextPage: boolean;
  loadMoreTriggerRef: React.RefObject<HTMLDivElement>;
  addPost: (post: Post) => void;
  refreshPosts: () => Promise<void>;
}

export function useCreatorPosts({
  creatorAddress,
  isAuthenticated,
  limit = 10,
}: UseCreatorPostsOptions): UseCreatorPostsReturn {
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);

  const fetchPosts = useCallback(
    async (page: number, isInitialLoad: boolean = false) => {
      if (!creatorAddress || !isAuthenticated) return;

      if (isInitialLoad) {
        setIsLoadingPosts(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/creator/${creatorAddress}/posts`,
          {
            params: { page, limit },
            withCredentials: true,
          }
        );

        const { posts: fetchedPosts, pagination } = response.data;

        // Map backend response to frontend Post type
        const mappedPosts: Post[] = fetchedPosts.map((post: any) => ({
          id: post.id,
          creatorAddress: post.creatorAddress,
          content: post.isLocked ? null : post.content,
          requiredTokens: Number(post.tokenThreshold),
          createdAt: new Date(post.createdAt),
          type: post.contentType.toLowerCase() as "text" | "image" | "video",
          isLocked: post.isLocked,
        }));

        if (isInitialLoad) {
          setPosts(mappedPosts);
        } else {
          setPosts((prev) => [...prev, ...mappedPosts]);
        }

        setHasNextPage(pagination.hasNextPage);
        setCurrentPage(page);
      } catch (error: any) {
        console.error("Error fetching posts:", error);
        // Only show error toast if it's not a 404 (creator not found)
        if (error.response?.status !== 404) {
          toast.error("Failed to load posts");
        }
      } finally {
        setIsLoadingPosts(false);
        setIsLoadingMore(false);
      }
    },
    [creatorAddress, isAuthenticated, limit]
  );

  // Initial posts fetch
  useEffect(() => {
    if (isAuthenticated && creatorAddress) {
      fetchPosts(1, true);
    }
  }, [isAuthenticated, creatorAddress, fetchPosts]);

  // Infinite scroll detection using Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (
          target.isIntersecting &&
          hasNextPage &&
          !isLoadingMore &&
          !isLoadingPosts
        ) {
          fetchPosts(currentPage + 1, false);
        }
      },
      { threshold: 0.1 }
    );

    const currentTrigger = loadMoreTriggerRef.current;
    if (currentTrigger) {
      observer.observe(currentTrigger);
    }

    return () => {
      if (currentTrigger) {
        observer.unobserve(currentTrigger);
      }
    };
  }, [hasNextPage, isLoadingMore, isLoadingPosts, currentPage, fetchPosts]);

  // Add a new post to the beginning of the list (for optimistic updates after creation)
  const addPost = useCallback((post: Post) => {
    setPosts((prev) => [post, ...prev]);
  }, []);

  // Refresh posts from the beginning
  const refreshPosts = useCallback(async () => {
    await fetchPosts(1, true);
  }, [fetchPosts]);

  return {
    posts,
    isLoadingPosts,
    isLoadingMore,
    hasNextPage,
    loadMoreTriggerRef,
    addPost,
    refreshPosts,
  };
}

