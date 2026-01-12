import { Link } from 'react-router-dom';

export default function HomePage(): React.ReactElement {
  return (
    <>
      <section className="flex flex-col items-center justify-center flex-1 bg-gradient-to-br from-[#3b0a84] to-[#5e60ce] text-white text-center p-10">
        <h2 className="text-4xl font-bold mb-4">Welcome to ProjectFlow</h2>
        <p className="text-lg max-w-xl mb-6">
          Manage your teams, projects, and tasks effortlessly with our powerful
          and intuitive project management app.
        </p>
        <Link
          to="/dashboard"
          className="bg-white text-[#3b0a84] px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition"
        >
          Go to Dashboard
        </Link>
      </section>

      <section className="bg-white py-12 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-[#3b0a84] mb-8">
            Why Choose ProjectFlow?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              'Simple & intuitive interface',
              'Collaborate in real-time',
              'Detailed project tracking',
              'Custom task workflows',
              'User roles & permissions',
              'Instant notifications',
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-gray-50 p-6 rounded-2xl shadow hover:shadow-md transition"
              >
                <h4 className="text-lg font-semibold text-[#3b0a84]">
                  {feature}
                </h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-[#3b0a84] to-[#5e60ce] text-white py-16 px-6 text-center">
        <h3 className="text-3xl font-bold mb-4">
          Simple Pricing for Every Team
        </h3>
        <p className="mb-8 max-w-xl mx-auto">
          Get started for free or upgrade to unlock more power.
        </p>
        <div className="flex justify-center gap-6 flex-wrap">
          {[
            {
              title: 'Free',
              price: '$0/mo',
              features: ['1 Project', 'Up to 5 Users'],
            },
            {
              title: 'Pro',
              price: '$12/mo',
              features: ['Unlimited Projects', 'Up to 50 Users'],
            },
            {
              title: 'Enterprise',
              price: 'Contact Us',
              features: ['Custom Setup', 'Unlimited Everything'],
            },
          ].map((plan, i) => (
            <div
              key={i}
              className="bg-white text-[#3b0a84] rounded-xl p-6 w-64 shadow"
            >
              <h4 className="text-xl font-bold mb-2">{plan.title}</h4>
              <p className="text-2xl font-bold mb-4">{plan.price}</p>
              <ul className="mb-4">
                {plan.features.map((f, j) => (
                  <li key={j} className="mb-1">
                    ✅ {f}
                  </li>
                ))}
              </ul>
              <button className="bg-[#3b0a84] text-white px-4 py-2 rounded-full hover:bg-[#2e0768]">
                Choose Plan
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-[#3b0a84] mb-8">
            What Our Users Say
          </h3>
          <blockquote className="text-xl italic text-gray-700 mb-4">
            "ProjectFlow transformed how we manage our team and deadlines. Easy
            to use, powerful features, and great support."
          </blockquote>
          <div className="text-[#3b0a84] font-semibold">
            — Sarah M., Project Manager
          </div>
        </div>
      </section>

      <section className="bg-[#1e1b4b] text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold mb-4">Stay In The Loop</h3>
          <p className="mb-6">Join our newsletter for updates and tips.</p>
          <form className="flex justify-center gap-2 flex-wrap">
            <input
              type="email"
              placeholder="Your email"
              className="rounded-full px-4 py-2 text-black"
            />
            <button className="bg-[#5e60ce] px-6 py-2 rounded-full hover:bg-[#6c6fdd]">
              Subscribe
            </button>
          </form>
        </div>
      </section>

      <footer className="bg-white py-8 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} ProjectFlow. All rights reserved.</p>
      </footer>
    </>
  );
}
