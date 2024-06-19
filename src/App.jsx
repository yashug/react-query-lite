import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import Posts from './components/Posts'
import Post from './components/Post'

const queryClient = new QueryClient()

function App() {
  const [postId, setPostId] = useState(-1)

  return (
    <QueryClientProvider client={queryClient}>
      <div className='h-screen'>
        <div className='p-4'>
          {postId > -1 ? (
            <Post postId={postId} setPostId={setPostId} />
          ) : (
            <Posts setPostId={setPostId} />
          )}
        </div>
      </div>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App
