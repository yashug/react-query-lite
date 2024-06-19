import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { sleep } from "../utils";

export default function Posts({ setPostId }) {
  const postsQuery = usePosts();

  return (
    <div>
      <h1 className="text-3xl">Posts</h1>
      <div className="mt-2">
        {postsQuery.isLoading ? (
          <div>Loading...</div>
        ) : postsQuery.isError ? (
          <div>Error: {postsQuery.error.message}</div>
        ) : (
          <>
            <ul className="list-none divide-solid divide-y-2 divide-gray-100">
              {postsQuery.data.map((post) => (
                <li
                  key={post.id}
                  onClick={() => setPostId(post.id)}
                  className="p-1 cursor-pointer hover:bg-blue-500 hover:text-white rounded"
                >
                  {post.title}
                  <button onClick={() => setPostId(post.id)}>View</button>
                </li>
              ))}
            </ul>
            <div className="mt-4 italic text-green-600 font-bold">
              {postsQuery.isFetching ? "Background Updating..." : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function usePosts() {
  return useQuery({
    queryKey: "posts",
    queryFn: async () => {
      await sleep(1000);
      const { data } = await axios.get(
        "https://jsonplaceholder.typicode.com/posts"
      );
      return data.slice(0, 5);
    },
    // staleTime: 3000,
    // cacheTime: 5000,
  });
}
