# AWS Student Builder Group — Central Hub

The official online presence and community hub for **AWS Student Builder Group (SBG)**, an AWS-affiliated, student-led community delivering AWS Study Jams, Cloud Practitioner & Solutions Architect certification prep, and hackathons.

---

## About AWS SBG

**AWS Student Builder Group** is a student-led, student-maintained initiative powered and supported by **Amazon Web Services (AWS)**. We connect student developers, cloud enthusiasts, and future AWS builders through:

- **Study Jams:** Structured learning paths for AWS certifications
- **Certification Prep:** Cloud Practitioner & Solutions Architect exam preparation
- **Hackathons:** Hands-on innovation challenges and community events
- **Community Support:** Peer mentoring and collaborative learning

---

## Tech Stack

This project is built with a modern, full-stack architecture:

- **Frontend:** Next.js (TypeScript/React) with Neo-Brutalist design system
- **Backend:** Python microservices & API integrations
- **Email:** Supabase Auth SMTP (server-side only)
- **Hosting:** Cloudflare Pages
- **Database:** Supabase (PostgreSQL)

---

## Design Philosophy: Hardcore Neo-Brutalism

AWS SBG embraces a stark, mechanical aesthetic:

- **Zero Rounded Corners:** `0px` razor-sharp geometry on all UI elements
- **Bold Borders & Shadows:** `3px solid #000000` with `4px 4px 0px` offset drop shadows
- **Limited Palette:** Pure Black, Pure White, AWS Electric Purple (`#7C3AED`), AWS Cyber Blue (`#2563EB`)
- **Monochrome Icons:** Solid SVG via `react-icons`; no emojis
- **Tactile Micro-interactions:** Left-to-right fill-slide hover sweeps, mechanical press feedback

---

## Key Features

✓ **Official AWS Affiliation** — Built with AWS support  
✓ **Community-Driven** — Student leadership & peer governance  
✓ **Zero Data Sale** — Personal data is never sold, rented, or traded  
✓ **Security-First** — Isolated admin portals, encrypted secrets, hardened headers  
✓ **Accessible & Fast** — Optimized for performance and inclusive design  

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.9+
- Supabase account
- Cloudflare account (for deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/Bryson77/AWSSGBLINKTREE.git
cd AWSSGBLINKTREE

# Install dependencies
npm install
pip install -r requirements.txt

# Run the development server
npm run dev
python api/main.py
```

Visit `http://localhost:3000` in your browser.

---

## Project Structure

```
.
├── app/                    # Next.js app directory
│   ├── page.tsx           # Homepage
│   ├── layout.tsx         # Root layout
│   └── api/               # API routes (server-side)
├── components/            # React components (Neo-Brutalist UI)
├── styles/                # Tailwind CSS & custom styles
├── lib/                   # Utilities & shared logic
├── api/                   # Python backend microservices
│   ├── main.py           # FastAPI entry point
│   └── routes/           # API endpoints
├── public/                # Static assets
└── README.md             # This file
```

---

## Security & Admin Portal

The `/admin` portal and `admin.awssbg.online` are **dedicated standalone management systems**:

- ✗ Never linked in public footers or navigation
- ✗ Isolated authentication & authorization
- ✓ Full audit logging
- ✓ Role-based access control

---

## Deployment

### Cloudflare Pages

```bash
npm run build
npm run deploy
```

Security headers are enforced via `_headers`:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
```

---

## Data Privacy

**AWS Student Builder Group takes data privacy seriously:**

- ✓ Zero data sale, rental, or trade
- ✓ GDPR and CCPA compliant
- ✓ Encrypted communication channels
- ✓ Transparent privacy policy

For details, see [PRIVACY.md](./PRIVACY.md).

---

## Support & Community

- **Join us:** [awssbg.online](https://awssbg.online)
- **Report issues:** [GitHub Issues](https://github.com/Bryson77/AWSSGBLINKTREE/issues)
- **Discussions:** [GitHub Discussions](https://github.com/Bryson77/AWSSGBLINKTREE/discussions)

---

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.

---

## Acknowledgments

**AWS Student Builder Group** is powered by:

- ❤️ **Amazon Web Services (AWS)** — Official sponsorship & support
- 🎓 **Student Leaders** — Building the community, one event at a time
- 👥 **Community Members** — Learners, mentors, and builders

---

**Built with ⚡ and ♥️ by the AWS Student Builder Group community.**
