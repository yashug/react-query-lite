import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { sleep } from "../utils";

export default function Post({ postId, setPostId }) {
  const postQuery = usePost(postId);
  return (
    <>
      <button
        className="px-2 py-1 text-lg font-bold bg-blue-500 text-white"
        onClick={() => setPostId(-1)}
      >
        Back
      </button>
      <div className="mt-4">
        {!postId || postQuery.isLoading ? (
          <div>Loading...</div>
        ) : postQuery.isError ? (
          <div>Error: {postQuery.error.message}</div>
        ) : (
          <>
            <div>
              <h1 className="text-2xl">{postQuery.data.title}</h1>
              <p className="mt-4">{postQuery.data.body}</p>
            </div>
            <div className="mt-4 italic text-green-600 font-bold">{postQuery.isFetching ? "Background Updating..." : null}</div>
          </>
        )}
      </div>
    </>
  );
}

function usePost(postId) {
  return useQuery({
    queryKey: ["post", postId],
    queryFn: async () => {
      await sleep(1000);
      const { data } = await axios.get(
        `https://jsonplaceholder.typicode.com/posts/${postId}`
      );
      return data;
    },
    // staleTime: 3000,
    // cacheTime: 5000,
  });
}
