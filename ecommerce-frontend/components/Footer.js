export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="mark">
              <span className="brand-mark">D</span> Dumverse Store
            </div>
            <p>
              A deliberately vulnerable e-commerce app built for hands-on security training —
              not a real store, no real payments.
            </p>
          </div>
          <div className="footer-col">
            <h4>Belanja</h4>
            <ul>
              <li><span>Katalog Produk</span></li>
              <li><span>Keranjang</span></li>
              <li><span>Pesanan Saya</span></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Akun</h4>
            <ul>
              <li><span>Profil</span></li>
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
          <span>© 2026 Dumverse Store · Training environment</span>
          <span>Styling adapted from the Sprylo template</span>
        </div>
      </div>
    </footer>
  );
}
