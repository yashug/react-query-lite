import { useState } from "react";
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import {
  QueryClient,
  QueryClientProvider,
  ReactQueryDevtools,
} from "./utils/react-query-lite";

import Posts from "./components/Posts";
import Post from "./components/Post";

const queryClient = new QueryClient();

function App() {
  const [postId, setPostId] = useState(-1);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="h-screen flex flex-col justify-between">
        <div className="p-4">
          {postId > -1 ? (
            <Post postId={postId} setPostId={setPostId} />
          ) : (
            <Posts setPostId={setPostId} />
          )}
        </div>
        <ReactQueryDevtools />
      </div>
    </QueryClientProvider>
  );
}

export default App;
