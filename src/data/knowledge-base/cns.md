# Cryptography and Network Security — Comprehensive Knowledge Base

## 1. Introduction to Security

**Information Security Goals (CIA Triad)**: Confidentiality (prevent unauthorized disclosure), Integrity (prevent unauthorized modification), Availability (ensure authorized access when needed). Additional goals: Authentication, Non-repudiation, Access Control.

**Attack Types**: Passive attacks (eavesdropping, traffic analysis — threaten confidentiality), Active attacks (modification, masquerade, replay, denial of service — threaten integrity/availability).

**Security Services**: Authentication, Access Control, Data Confidentiality, Data Integrity, Non-repudiation, Availability.

**Security Mechanisms**: Encryption, Digital Signatures, Access Control, Data Integrity checks, Authentication Exchange, Traffic Padding, Routing Control.

## 2. Classical Encryption Techniques

**Symmetric Key Cryptography**: Same key for encryption and decryption. Sender and receiver must share the secret key.

### Substitution Ciphers

**Caesar Cipher**: Shift each letter by fixed positions. C = (P + k) mod 26. Key space = 25. Easily broken by brute force or frequency analysis.

**Monoalphabetic Cipher**: Each letter maps to a unique different letter. Key space = 26! ≈ 4 × 10²⁶. Vulnerable to frequency analysis (English letter frequencies: E≈12.7%, T≈9.1%, A≈8.2%).

**Polyalphabetic Cipher (Vigenère)**: Uses a keyword to determine different Caesar shifts for each position. Repeating key creates patterns. Broken by Kasiski examination (finding repeated sequences to determine key length) and index of coincidence.

**Playfair Cipher**: Encrypts digrams (pairs of letters) using a 5×5 matrix. Rules: same row → shift right, same column → shift down, different row/column → rectangle swap.

**Hill Cipher**: Uses matrix multiplication. C = P × K mod 26 where K is an n×n invertible key matrix. Decryption: P = C × K⁻¹ mod 26. Vulnerable to known-plaintext attacks.

### Transposition Ciphers

**Rail Fence**: Write plaintext in zigzag pattern across rows, read row by row.

**Columnar Transposition**: Write plaintext in rows under a key, read columns in key order. Double transposition applies the process twice.

## 3. Modern Symmetric Encryption

### DES (Data Encryption Standard)

**Block cipher**: 64-bit block size, 56-bit effective key (64 bits with 8 parity). 16 rounds of Feistel structure.

**Feistel Structure**: Each round: divide block into L and R halves. L_i = R_{i-1}, R_i = L_{i-1} ⊕ f(R_{i-1}, K_i). Decryption uses same structure with keys in reverse order.

**DES Round Function**: Expansion (32→48 bits), XOR with round key, S-box substitution (48→32 bits, 8 S-boxes, 6 bits → 4 bits each), permutation (P-box).

**Key Schedule**: 56-bit key generates 16 round keys of 48 bits each via Permuted Choice 1 (PC-1), left circular shifts, Permuted Choice 2 (PC-2).

**Triple DES (3DES)**: Three DES operations with 2 or 3 keys. E-D-E scheme: C = E_{K3}(D_{K2}(E_{K1}(P))). Key size: 112 or 168 bits effective.

**Modes of Operation**:
- **ECB (Electronic Codebook)**: Each block encrypted independently. Same plaintext block → same ciphertext block. Not recommended for large data.
- **CBC (Cipher Block Chaining)**: C_i = E_K(P_i ⊕ C_{i-1}). IV required. Error propagates to next block. Most common mode.
- **CFB (Cipher Feedback)**: Turns block cipher into stream cipher. Encryption of shift register XORed with plaintext.
- **OFB (Output Feedback)**: Similar to CFB but feedback is from the output of encryption, not ciphertext. No error propagation.
- **CTR (Counter)**: Encrypts counter values, XORs with plaintext. Parallelizable. No error propagation.

### AES (Advanced Encryption Standard)

**Rijndael algorithm** selected in 2001 to replace DES. Block size: 128 bits. Key sizes: 128/192/256 bits. Rounds: 10/12/14 respectively.

**State Matrix**: 4×4 matrix of bytes. Operations on the entire state:

1. **SubBytes**: Byte-by-byte substitution using S-box (based on multiplicative inverse in GF(2⁸) followed by affine transformation). Non-linear — provides confusion.

2. **ShiftRows**: Row 0 no shift, Row 1 shift left 1, Row 2 shift left 2, Row 3 shift left 3. Provides diffusion.

3. **MixColumns**: Each column treated as polynomial over GF(2⁸), multiplied by fixed polynomial. Provides diffusion. (Omitted in last round.)

4. **AddRoundKey**: XOR state with round key.

**Key Expansion**: Generates (Nr+1) round keys from the cipher key using RotWord, SubWord, and XOR with Rcon.

AES is the current standard for symmetric encryption. Used in TLS, Wi-Fi (WPA2/WPA3), disk encryption (BitLocker, FileVault), VPNs.

## 4. Public Key Cryptography

**Asymmetric Encryption**: Two keys — public key (shared openly) and private key (kept secret). Encrypt with public key → decrypt with private key. Or sign with private key → verify with public key.

### RSA (Rivest-Shamir-Adleman)

**Key Generation**:
1. Choose two large primes p and q
2. Compute n = p × q (modulus)
3. Compute φ(n) = (p-1)(q-1) (Euler's totient)
4. Choose e such that 1 < e < φ(n) and gcd(e, φ(n)) = 1 (commonly e = 65537)
5. Compute d = e⁻¹ mod φ(n) (using Extended Euclidean Algorithm)
6. Public key: (e, n). Private key: (d, n)

**Encryption**: C = M^e mod n
**Decryption**: M = C^d mod n

**Security**: Based on the difficulty of factoring large numbers (RSA problem). Key size: 2048-4096 bits for security.

### Diffie-Hellman Key Exchange

**Purpose**: Two parties can agree on a shared secret over an insecure channel without prior shared secret.

**Protocol**:
1. Agree on public parameters: large prime p and generator g
2. Alice: choose random a, send A = g^a mod p
3. Bob: choose random b, send B = g^b mod p
4. Shared secret: Alice computes K = B^a mod p, Bob computes K = A^b mod p. Both get g^(ab) mod p.

**Security**: Based on Discrete Logarithm Problem (DLP). Vulnerable to Man-in-the-Middle attack without authentication.

### Elliptic Curve Cryptography (ECC)

Uses points on an elliptic curve y² = x³ + ax + b over a finite field. Shorter keys provide equivalent security to RSA (256-bit ECC ≈ 3072-bit RSA). Operations: point addition, scalar multiplication. Used in TLS 1.3, Bitcoin (secp256k1), modern protocols.

### ElGamal Encryption

Based on Diffie-Hellman. Key generation: choose prime p, generator g, private key x, public key y = g^x mod p. Encryption produces two values (c1, c2). Ciphertext is double the plaintext size.

## 5. Hash Functions

A **cryptographic hash function** H maps arbitrary-length input to fixed-length output (digest/hash). Properties:
- **Pre-image resistance**: Given h, hard to find m such that H(m) = h
- **Second pre-image resistance**: Given m1, hard to find m2 ≠ m1 such that H(m1) = H(m2)
- **Collision resistance**: Hard to find any m1 ≠ m2 such that H(m1) = H(m2)

**MD5**: 128-bit output. Merkle-Damgård construction, 4 rounds of 16 steps. Broken — collision attacks demonstrated. Not for security use.

**SHA-1**: 160-bit output. Based on MD5 design. Broken in 2017 (Google's SHAttered attack). Deprecated.

**SHA-2 Family**: SHA-224, SHA-256, SHA-384, SHA-512. Secure. SHA-256 produces 256-bit hash. Used in Bitcoin, TLS, code signing.

**SHA-3 (Keccak)**: Sponge construction (not Merkle-Damgård). Selected in 2012. Provides same security guarantees as SHA-2 with different design.

**HMAC (Hash-based Message Authentication Code)**: HMAC(K, m) = H((K ⊕ opad) || H((K ⊕ ipad) || m)). Provides message integrity and authentication using a shared secret key.

**Birthday Attack**: Exploits birthday paradox. For n-bit hash, collision can be found in ~2^(n/2) operations. Hence 128-bit hash needs only ~2^64 operations to find collision.

## 6. Digital Signatures

Provides authentication, integrity, and non-repudiation. Signer uses private key to sign, verifier uses public key to verify.

**RSA Signature**: Sign: S = H(M)^d mod n. Verify: H(M) =? S^e mod n.

**DSA (Digital Signature Algorithm)**: Based on discrete logarithm. Faster signing than RSA. Standard from NIST (DSS — Digital Signature Standard).

**ECDSA (Elliptic Curve DSA)**: DSA using elliptic curves. Shorter signatures with equivalent security. Used in Bitcoin, TLS.

## 7. Key Management and PKI

**Public Key Infrastructure (PKI)**: Framework for managing digital certificates and public keys.

**Certificate Authority (CA)**: Trusted third party that issues digital certificates binding public keys to identities.

**X.509 Certificate**: Contains: version, serial number, signature algorithm, issuer (CA), validity period, subject, public key, extensions, CA's digital signature.

**Certificate Chain**: End-entity cert → Intermediate CA cert → Root CA cert. Root CA is self-signed and trusted by browsers/OS.

**Certificate Revocation**: CRL (Certificate Revocation List — periodically published list), OCSP (Online Certificate Status Protocol — real-time query).

**Key Distribution**: Symmetric key distribution via KDC (Key Distribution Center) using Needham-Schroeder protocol. Kerberos: trusted third-party authentication protocol using tickets and session keys.

## 8. Network Security Protocols

### SSL/TLS (Secure Sockets Layer / Transport Layer Security)

**Purpose**: Secure communication over networks. Provides confidentiality, integrity, authentication.

**TLS Handshake**:
1. ClientHello: supported cipher suites, random number
2. ServerHello: chosen cipher suite, random number
3. Server Certificate: server's X.509 certificate
4. Key Exchange: Diffie-Hellman or RSA
5. Finished: verify handshake integrity

**TLS 1.3**: Reduced handshake to 1-RTT (or 0-RTT for resumption). Removed insecure algorithms (RSA key exchange, CBC mode, SHA-1). Only supports AEAD ciphers (AES-GCM, ChaCha20-Poly1305).

### IPSec

**Internet Protocol Security**: Network layer security. Two protocols:
- **AH (Authentication Header)**: Integrity and authentication. No encryption.
- **ESP (Encapsulating Security Payload)**: Encryption + integrity + authentication.

**Modes**: Transport mode (protects payload only), Tunnel mode (protects entire IP packet, adds new IP header — used in VPNs).

**IKE (Internet Key Exchange)**: Protocol for establishing Security Associations (SA) and exchanging keys.

### PGP (Pretty Good Privacy)

Email security. Combines symmetric encryption (message), public key encryption (session key), digital signature, compression, Base64 encoding.

**Web of Trust**: Decentralized trust model — users sign each other's public keys. Alternative to centralized PKI.

### Kerberos

Trusted third-party authentication using symmetric encryption. Components: Client, Authentication Server (AS), Ticket Granting Server (TGS), Service Server.

**Process**: Client → AS (get TGT) → TGS (get service ticket) → Service Server. All communication encrypted. Prevents replay attacks using timestamps and nonces.

## 9. Firewalls and IDS

**Firewall**: Network security device filtering traffic based on rules.
- **Packet Filter**: Examines packet headers (IP, port, protocol). Stateless.
- **Stateful Packet Filter**: Tracks connection state. More secure.
- **Application Gateway (Proxy)**: Operates at application layer. Full content inspection.
- **Circuit Gateway**: Operates at session layer. Monitors TCP handshakes.

**IDS (Intrusion Detection System)**: Monitors network/system for malicious activity.
- **Signature-based**: Matches known attack patterns. Fast but can't detect new attacks.
- **Anomaly-based**: Establishes baseline of normal behavior, flags deviations. Can detect new attacks but higher false positives.

**IPS (Intrusion Prevention System)**: Active IDS that can block detected attacks.

## 10. Email and Web Security

**S/MIME**: Secure email standard. Uses X.509 certificates, RSA/AES encryption, digital signatures.

**DKIM (DomainKeys Identified Mail)**: Email authentication using DNS-published public keys. Sender signs email headers/body with private key.

**HTTPS**: HTTP over TLS. Default port 443. Certificate validation, encrypted communication.

**CORS (Cross-Origin Resource Sharing)**: Browser security mechanism controlling cross-origin HTTP requests.

**CSP (Content Security Policy)**: HTTP header specifying allowed sources for scripts, styles, etc. Mitigates XSS attacks.

**OWASP Top 10**: Injection, Broken Authentication, Sensitive Data Exposure, XML External Entities, Broken Access Control, Security Misconfiguration, XSS, Insecure Deserialization, Using Components with Known Vulnerabilities, Insufficient Logging.
