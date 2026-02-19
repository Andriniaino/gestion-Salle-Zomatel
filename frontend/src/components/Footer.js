import { Container, Row, Col } from "react-bootstrap";
import { FaWhatsapp } from "react-icons/fa";


const Footer = () => {
  // 🎨 Styles centralisés
  const styles = {
    footer: {
      background: "#2c2c2c",
      color: "white",
      padding: "40px 0",
      marginTop: "40px",
    },
    heading: {
      color: "#ffffff",
      marginBottom: "15px",
    },
    link: {
      color: "#ffffff",
      textDecoration: "none",
    },
    hr: {
      borderColor: "#",
      margin: "20px 0",
    },
    copy: {
      textAlign: "center",
      fontSize: "14px",
      color: "#ccc",
    },
  };

  return (
    <footer style={styles.footer}>
      <Container>
        <Row>
          {/* Colonne 1 : Présentation */}
          <Col md={4} sm={12}>
            <h4 style={styles.heading}>ZOMATEL ★★★</h4>
            <p>
              Un hôtel trois étoiles qui allie confort, gastronomie et service
              personnalisé.
            </p>
          </Col>

          {/* Colonne 2 : Contact */}
          <Col md={4} sm={12}>
            <h4 style={styles.heading}>Contact admin</h4>
            <p>📍 :Fianarantsoa, Madagascar</p>
            <p>📞: +261 38 338 09</p>
            <p>
              <FaWhatsapp color="#25D366" size={20} style={{ marginRight: "5px" }} />
              : +261 38 338 09
            </p>
            <p>✉️ :roddy@zomatel.com</p>
          </Col>

          {/* Colonne 3 : Liens utiles */}
          <Col md={4} sm={12}>
            <h4 style={styles.heading}>Liens utiles</h4>
            <p>
              <a href="https://www.facebook.com/zomatel" style={styles.link}>
                Facebook
              </a>
              {" • "}
              <a href="https://www.instagram.com/zomatel" style={styles.link}>
                Instagram
              </a>
              {" • "}
              <a href="https://www.zomatel-madagascar.com/" style={styles.link}>
                www.zomatel.mg
              </a>
            </p>
          </Col>
        </Row>

        <hr style={styles.hr} />
        <p style={styles.copy}>
          © 2026 ZOMATEL/Puissance — Hôtel trois étoiles à Fianarantsoa.
        </p>
      </Container>
    </footer>
  );
};

export default Footer;
