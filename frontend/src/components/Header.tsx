import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';

export default function Header(): React.ReactElement {
  const { session } = useAuth();

  return (
    <header className="bg-[#3b0a84] text-white px-6 py-4 shadow-md sticky top-0">
      <div className="container mx-auto flex justify-between items-center">
        <a className="text-xl font-bold" href="/">
          ProjectFlow
        </a>
        <nav>
          {!session ? (
            <>
              <Link to="/dashboard" className="hover:underline mr-4">
                Dashboard
              </Link>
              <Link to="/login" className="hover:underline">
                Login
              </Link>
            </>
          ) : (
            <></>
          )}
        </nav>
      </div>
    </header>
  );
}
