export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="mark">
              <span className="brand-mark">E</span> Eventra Tickets
            </div>
            <p>
              A deliberately vulnerable event ticketing app built for hands-on security
              training — not a real box office, no real payments.
            </p>
          </div>
          <div className="footer-col">
            <h4>Event</h4>
            <ul>
              <li><span>Daftar Event</span></li>
              <li><span>Tiket Saya</span></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Akun</h4>
            <ul>
              <li><span>Login</span></li>
              <li><span>Daftar</span></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Training Lab</h4>
            <ul>
              <li><span>Deliberately vulnerable</span></li>
              <li><span>For pentest practice only</span></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Eventra Tickets · Training environment</span>
          <span>Styling adapted from the Sprylo template</span>
        </div>
      </div>
    </footer>
  );
}
