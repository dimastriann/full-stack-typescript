import { Link } from 'react-router-dom';

export default function Header(): React.ReactElement {
  return (
    <header className="bg-[#3b0a84] text-white px-6 py-4 shadow-md sticky top-0">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">ProjectFlow</h1>
        <nav>
          <Link to="/" className="hover:underline mr-4">
            Home
          </Link>
          <Link to="/dashboard" className="hover:underline mr-4">
            Admin
          </Link>
          <Link to="/login" className="hover:underline">
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}
