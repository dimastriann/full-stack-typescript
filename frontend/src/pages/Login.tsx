export default function LoginPage(): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#3b0a84] to-[#5e60ce] text-white px-4">
      <h2 className="text-3xl font-bold mb-6">Login to ProjectFlow</h2>
      <form className="w-full max-w-sm space-y-4 bg-white text-black p-6 rounded-lg shadow">
        <div>
          <label htmlFor="email" className="block mb-1 font-medium">
            Email
          </label>
          <input
            type="email"
            id="email"
            className="w-full px-4 py-2 rounded border"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block mb-1 font-medium">
            Password
          </label>
          <input
            type="password"
            id="password"
            className="w-full px-4 py-2 rounded border"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-[#3b0a84] text-white px-4 py-2 rounded hover:bg-[#2e0768]"
        >
          Login
        </button>
        <div className="text-center text-gray-500">or</div>
        <button
          onClick={() => alert('Under constraction!')}
          className="w-full text-center bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Sign in with Google
        </button>
        <button
          onClick={() => alert('Under constraction!')}
          className="w-full text-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Sign in with Facebook
        </button>
      </form>
    </div>
  );
}
