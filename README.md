# 🛡️ LOLDrivers Database

<div align="center">

**Find the known vulnerable driver that suit your needs**

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fdidntchooseaname%2Floldrivers-database.svg?type=shield&issueType=license)](https://app.fossa.com/projects/git%2Bgithub.com%2Fdidntchooseaname%2Floldrivers-database?ref=badge_shield&issueType=license)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fdidntchooseaname%2Floldrivers-database.svg?type=shield&issueType=security)](https://app.fossa.com/projects/git%2Bgithub.com%2Fdidntchooseaname%2Floldrivers-database?ref=badge_shield&issueType=security)
[![DeepWiki](https://img.shields.io/badge/DeepWiki-didntchooseaname%2Floldrivers--database-blue.svg?logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAyCAYAAAAnWDnqAAAAAXNSR0IArs4c6QAAA05JREFUaEPtmUtyEzEQhtWTQyQLHNak2AB7ZnyXZMEjXMGeK/AIi+QuHrMnbChYY7MIh8g01fJoopFb0uhhEqqcbWTp06/uv1saEDv4O3n3dV60RfP947Mm9/SQc0ICFQgzfc4CYZoTPAswgSJCCUJUnAAoRHOAUOcATwbmVLWdGoH//PB8mnKqScAhsD0kYP3j/Yt5LPQe2KvcXmGvRHcDnpxfL2zOYJ1mFwrryWTz0advv1Ut4CJgf5uhDuDj5eUcAUoahrdY/56ebRWeraTjMt/00Sh3UDtjgHtQNHwcRGOC98BJEAEymycmYcWwOprTgcB6VZ5JK5TAJ+fXGLBm3FDAmn6oPPjR4rKCAoJCal2eAiQp2x0vxTPB3ALO2CRkwmDy5WohzBDwSEFKRwPbknEggCPB/imwrycgxX2NzoMCHhPkDwqYMr9tRcP5qNrMZHkVnOjRMWwLCcr8ohBVb1OMjxLwGCvjTikrsBOiA6fNyCrm8V1rP93iVPpwaE+gO0SsWmPiXB+jikdf6SizrT5qKasx5j8ABbHpFTx+vFXp9EnYQmLx02h1QTTrl6eDqxLnGjporxl3NL3agEvXdT0WmEost648sQOYAeJS9Q7bfUVoMGnjo4AZdUMQku50McDcMWcBPvr0SzbTAFDfvJqwLzgxwATnCgnp4wDl6Aa+Ax283gghmj+vj7feE2KBBRMW3FzOpLOADl0Isb5587h/U4gGvkt5v60Z1VLG8BhYjbzRwyQZemwAd6cCR5/XFWLYZRIMpX39AR0tjaGGiGzLVyhse5C9RKC6ai42ppWPKiBagOvaYk8lO7DajerabOZP46Lby5wKjw1HCRx7p9sVMOWGzb/vA1hwiWc6jm3MvQDTogQkiqIhJV0nBQBTU+3okKCFDy9WwferkHjtxib7t3xIUQtHxnIwtx4mpg26/HfwVNVDb4oI9RHmx5WGelRVlrtiw43zboCLaxv46AZeB3IlTkwouebTr1y2NjSpHz68WNFjHvupy3q8TFn3Hos2IAk4Ju5dCo8B3wP7VPr/FGaKiG+T+v+TQqIrOqMTL1VdWV1DdmcbO8KXBz6esmYWYKPwDL5b5FA1a0hwapHiom0r/cKaoqr+27/XcrS5UwSMbQAAAABJRU5ErkJggg==)](https://deepwiki.com/didntchooseaname/loldrivers-database)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

[🚀 Live Demo](https://loldb.xsec.fr) | [📚 Documentation](https://deepwiki.com/didntchooseaname/loldrivers-database) | [🤝 Contributing](#contributing)

</div>

---

## 🎯 Project Vision

### Problem

Traditional driver analysis tools can have limitations:
- **Static cataloging** without behavioral analysis
- **Inaccurate HVCI compatibility** checks using outdated local lists
- **Limited search capabilities** across driver metadata
- **Poor user experience** for security researchers

### Solution

This platform goes **beyond simple cataloging** to provide:
- **Behavioral analysis** through imported function examination
- **Strict HVCI verification** using Microsoft's official blocklist
- **Advanced filtering** by capabilities, architecture, and certificates

## ✨ Features

### 🧠 Drivers Behaviors
Unlike static driver lists, this platform analyzes imported functions to automatically detect capabilities:
- **Memory manipulation** (allocation, virtual memory, mapping)
- **Process killing** (termination)
- **Debug bypass** (anti-debugging, information hiding)
- **Registry manipulation** (key creation, modification, deletion)
- **File system access** (file creation, modification, I/O operations)

### 🛡️ Strict HVCI Verification
[![HVCI Drivers Check](https://github.com/didntchooseaname/loldrivers-database/actions/workflows/hvci-drivers-check.yml/badge.svg)](https://github.com/didntchooseaname/loldrivers-database/actions/workflows/hvci-drivers-check.yml)
[![HVCI Statistics](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/didntchooseaname/loldrivers-database/main/.github/hvci-stats.json)](https://github.com/didntchooseaname/loldrivers-database/actions/workflows/hvci-drivers-check.yml)

- **Direct Microsoft drivers blocklist integration** - Queries official vulnerable driver blocklist
- **Automated workflows** - GitHub Actions fetch latest XML blocklist
- **Up-to-date** - No reliance on static local lists (Trails of bit local script)

### 🔍 Search & Filtering
- **Multi-attribute search** - Hashes, company names, descriptions
- **Behavioral filters** - Search by detected capabilities
- **Certificate analysis** - Trusted vs. unknown authorities
- **Architecture-aware** - Filter by x64, x32, ARM64 with visual indicators
- **URL state management** - Bookmark and share search queries

### 📊 Certificate Analysis System
- **Comprehensive validation** - Analyzes complete certificate chains
- **Trust categorization** - Trusted CAs vs. unknown/expired certificates
- **Risk assessment** - Identifies self-signed, revoked, or compromised certificates
- **Visual indicators** - Clear trust status in driver cards

## 🏗️ Technical Implementation

### Modern Architecture
- **Next.js 15** with App Router and React 18
- **TypeScript** for type safety and better development experience
- **Server-side processing** for optimal performance with large datasets
- **SWR caching** for intelligent data fetching and synchronization

### Performance Optimizations
- **Server-Side Rendering (SSR)** for lightning-fast initial loads
- **Intelligent caching** - Multi-layer cache strategy (memory + HTTP)
- **Bundle optimization** - Code splitting and lazy loading
- **Responsive design** - Optimized for all devices and screen sizes

### Data Pipeline
- **Automated integration** with LOLDrivers project
- **GitHub Actions** - Scheduled HVCI blocklist synchronization
- **Error handling** - Robust data processing and validation

## 🎯 Use Cases & Applications

### 🔬 Security Research
- **BYOVD attack research** - Investigate Bring Your Own Vulnerable Driver campaigns
- **Threat hunting** - Discover suspicious drivers in enterprise environments
- **Malware analysis** - Research driver-based malware families and capabilities
- **Academic studies** - Support cybersecurity research and publications


### 🌐 Community & Collaboration
- **Open-source approach** - Encourages community contributions
- **Knowledge sharing** - Collaborative security research platform
- **Threat intelligence** - Aggregated analysis for security teams
- **Research publishing** - Support for responsible disclosure practices

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm 9+

### Installation
```bash
# Clone the repository
git clone https://github.com/didntchooseaname/loldrivers-database.git
cd loldrivers-database

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

### Production Deployment
```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## 📖 Key Terms & Concepts

- **HVCI** - Hypervisor-protected Code Integrity, Windows security feature using hypervisor technology
- **Process Killer Drivers** - Legitimate drivers exploitable for terminating processes with elevated privileges
- **Behavioral Analysis** - Automated capability detection through imported function analysis
- **BYOVD** - Bring Your Own Vulnerable Driver attacks using legitimate-but-vulnerable drivers
- **Certificate Trust** - Validation of driver signing authorities and certificate chains

## �️ Available Scripts

```bash
pnpm dev          # Development server
pnpm build        # Production build
pnpm start        # Production server
pnpm lint         # ESLint checking
pnpm type-check   # TypeScript validation
```

## 🤝 Contributing

We welcome contributions from the security research community:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Contribution Guidelines
- Follow TypeScript best practices
- Add tests for new features
- Update documentation as needed
- Ensure compatibility with existing features

## ⚖️ Legal & Ethical Notice

**Purpose**: This database is designed for **legitimate security research and defensive purposes only**.

**Compliance**: Users must comply with applicable laws, organizational policies, and ethical guidelines.

**Prohibition**: Misuse of this information for malicious purposes is **strictly prohibited**.

**Community**: Join the security research community in improving driver security through responsible disclosure and collaborative research.

## 📄 Disclaimer

This project is provided **"as is"** without any warranty, guarantee, or reliability assurance. The maintainers are not responsible for the accuracy, completeness, or functionality of the data or platform. Users assume all risks and responsibilities when using this database and its information.

## 🔗 Related Projects & Resources

- [LOLDrivers.io](https://loldrivers.io) - Original project and data source
- [magicsword-io/LOLDrivers](https://github.com/magicsword-io/LOLDrivers) - Source repository
- [Microsoft HVCI Blocklist](https://aka.ms/VulnerableDriverBlockList) - Official vulnerability list

## Contributors & Acknowledgments

**Special thanks** to the original LOLDrivers project and its contributors:
- **Michael Haag** - Project leadership and development
- **Jose Hernandez** - Security research and analysis
- **Nasreddine Bencherchali** - Detection engineering and rules

## 📧 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/didntchooseaname/loldrivers-database/issues)
- **Discussions**: [GitHub Discussions](https://github.com/didntchooseaname/loldrivers-database/discussions)
- **Security**: Please report security vulnerabilities responsibly

---

<div align="center">

**Made with ❤️ for the cybersecurity research community**

[⭐ Star this project](https://github.com/didntchooseaname/loldrivers-database) if it helps your security research!

</div>