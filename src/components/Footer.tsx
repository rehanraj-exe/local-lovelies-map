import { Facebook, Instagram, Linkedin, Mail, Phone } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-[#111] text-gray-300 mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">About re:local</h3>
            <p className="text-sm leading-relaxed">
              Connecting local businesses with their community. Discover amazing shops, 
              cafes, and services right in your neighborhood.
            </p>
          </div>

          {/* Team Credits */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Team</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-gray-400">Idea by:</span> Dheeraj
              </li>
              <li>
                <span className="text-gray-400">Contributions:</span> Durga Prasad
              </li>
              <li>
                <span className="text-gray-400">Project Assistance:</span> Mokshith
              </li>
              <li>
                <span className="text-gray-400">Developed by:</span> Rehan Raj
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 hover:text-white transition-colors">
                <Phone className="h-4 w-4" />
                <a href="tel:+919824756329">+91 98247 56329</a>
              </li>
              <li className="flex items-center gap-2 hover:text-white transition-colors">
                <Mail className="h-4 w-4" />
                <a href="mailto:contact@re-local.in">contact@re-local.in</a>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Follow Us</h3>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm">
          <p>© 2025 re:local. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
