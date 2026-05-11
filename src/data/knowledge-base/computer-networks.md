# Computer Networks — Comprehensive Knowledge Base

## 1. Introduction and Network Models

**Computer Network**: A collection of interconnected devices (nodes) that communicate and share resources using defined protocols.

**Network Types**: LAN (Local Area Network — building/campus), MAN (Metropolitan — city), WAN (Wide Area — country/globe), PAN (Personal — few meters).

**Network Topologies**: Bus (shared medium), Star (central hub), Ring (circular), Mesh (every node connected to every other — full or partial), Tree (hierarchical), Hybrid.

### OSI Reference Model (7 Layers)

**Layer 7 — Application**: End-user services. HTTP, FTP, SMTP, DNS, SNMP, Telnet, SSH. Provides interface for user applications.

**Layer 6 — Presentation**: Data format translation, encryption/decryption, compression. Converts between application and network formats. SSL/TLS encryption, JPEG/MPEG encoding, ASCII/EBCDIC translation.

**Layer 5 — Session**: Manages sessions between applications. Session establishment, maintenance, termination. Dialog control (simplex, half-duplex, full-duplex). Synchronization points for recovery.

**Layer 4 — Transport**: End-to-end communication, segmentation, flow control, error control. TCP (reliable, connection-oriented), UDP (unreliable, connectionless). Port numbers (0-65535). Multiplexing/demultiplexing.

**Layer 3 — Network**: Logical addressing (IP), routing, packet forwarding. Routers operate here. IP, ICMP, ARP, RARP, OSPF, BGP.

**Layer 2 — Data Link**: Framing, physical addressing (MAC), error detection, flow control, medium access control. Switches and bridges operate here. Ethernet, Wi-Fi, PPP.

**Layer 1 — Physical**: Bit transmission over physical medium. Cables, signals, connectors, encoding. Hubs, repeaters operate here.

### TCP/IP Model (4 Layers)

**Application Layer**: Combines OSI layers 5-7. HTTP, FTP, SMTP, DNS, DHCP, SNMP, SSH, Telnet.

**Transport Layer**: TCP and UDP. Same as OSI Layer 4.

**Internet Layer**: IP, ICMP, ARP, IGMP. Routing and logical addressing. Same as OSI Layer 3.

**Network Access Layer**: Combines OSI layers 1-2. Ethernet, Wi-Fi, PPP. Physical and data link functions.

## 2. Physical Layer

**Transmission Media**:
- **Guided (Wired)**: Twisted pair (UTP/STP — Cat5e/Cat6, up to 10Gbps), Coaxial cable (TV, older Ethernet), Fiber optic (single-mode for long distance, multi-mode for shorter — light signals, highest bandwidth)
- **Unguided (Wireless)**: Radio waves, Microwaves, Infrared, Satellite

**Signal Types**: Analog (continuous) vs Digital (discrete). Bandwidth = range of frequencies a channel can transmit.

**Shannon's Theorem**: C = B × log₂(1 + SNR). Maximum data rate of a noisy channel. C = capacity (bps), B = bandwidth (Hz), SNR = signal-to-noise ratio.

**Nyquist's Theorem**: C = 2B × log₂(L). Maximum data rate for noiseless channel. L = number of signal levels.

**Encoding Schemes**: NRZ (Non-Return to Zero), Manchester (transition in middle of each bit — used in Ethernet), Differential Manchester (transition at start = 0, no transition = 1), 4B/5B, 8B/10B.

**Multiplexing**: FDM (Frequency Division — analog), TDM (Time Division — synchronous/statistical), WDM (Wavelength Division — fiber optic), CDM (Code Division — spread spectrum).

## 3. Data Link Layer

**Functions**: Framing, physical addressing (MAC), error control, flow control, access control.

**Framing**: Dividing bit stream into frames. Methods: character count, byte stuffing (with flag bytes), bit stuffing (with flag bits — HDLC uses 01111110).

### Error Detection and Correction

**Parity Check**: Single bit parity — detects odd number of errors. Two-dimensional parity — detects and corrects single-bit errors.

**Checksum**: Sum of data segments. Sender computes checksum, receiver verifies. Used in TCP/UDP/IP.

**CRC (Cyclic Redundancy Check)**: Treats data as polynomial, divides by generator polynomial. Remainder appended to data. At receiver, division should yield zero remainder. Detects all single-bit, double-bit, and odd-number-of-bit errors; all burst errors ≤ degree of generator.

**Hamming Code**: Error-correcting code. For m data bits, r = ⌈log₂(m+r+1)⌉ redundant bits needed. Parity bits at positions 2⁰, 2¹, 2², .... Can correct single-bit errors and detect double-bit errors (SEC-DED with extra parity bit).

### Flow Control

**Stop-and-Wait**: Send one frame, wait for ACK before sending next. Simple but inefficient. Utilization = T_frame / (T_frame + 2×T_prop + T_ack).

**Sliding Window**: Sender can send multiple frames without waiting. Window size W determines max unacknowledged frames. Two variants:

**Go-Back-N (GBN)**: Sender window W ≤ 2ⁿ - 1, receiver window = 1. On error, retransmit from the errored frame onward. Receiver discards out-of-order frames. Cumulative ACKs.

**Selective Repeat (SR)**: Sender window W ≤ 2ⁿ⁻¹, receiver window = sender window. Only retransmit errored frames. Receiver buffers out-of-order frames. Individual ACKs.

### Medium Access Control (MAC)

**ALOHA**: Pure ALOHA — transmit anytime, max throughput 18.4% (S = G × e^(-2G)). Slotted ALOHA — transmit at slot boundaries only, max throughput 36.8%.

**CSMA (Carrier Sense Multiple Access)**: Listen before transmitting.
- 1-persistent: Transmit immediately if idle, wait if busy
- Non-persistent: If busy, wait random time before sensing again
- p-persistent: If idle, transmit with probability p

**CSMA/CD (Collision Detection)**: Used in wired Ethernet. Detect collision during transmission, stop and send jam signal, binary exponential backoff. Minimum frame size = 2 × propagation delay × bandwidth.

**CSMA/CA (Collision Avoidance)**: Used in Wi-Fi (802.11). Can't detect collisions in wireless. Uses RTS/CTS handshake, ACKs, and random backoff.

**Ethernet (IEEE 802.3)**: Frame format: Preamble (7B) + SFD (1B) + Dest MAC (6B) + Src MAC (6B) + Type/Length (2B) + Data (46-1500B) + FCS/CRC (4B). Min frame: 64 bytes. Max frame: 1518 bytes.

**MAC Address**: 48-bit hardware address. First 24 bits = OUI (manufacturer), last 24 bits = device ID. Format: XX:XX:XX:XX:XX:XX.

## 4. Network Layer

### IP Addressing

**IPv4**: 32-bit address. Dotted decimal notation (e.g., 192.168.1.1). Total: ~4.3 billion addresses.

**Classful Addressing**:
- Class A: 0.0.0.0 – 127.255.255.255. /8 prefix. Large networks.
- Class B: 128.0.0.0 – 191.255.255.255. /16 prefix. Medium networks.
- Class C: 192.0.0.0 – 223.255.255.255. /24 prefix. Small networks.
- Class D: 224.0.0.0 – 239.255.255.255. Multicast.
- Class E: 240.0.0.0 – 255.255.255.255. Reserved/experimental.

**CIDR (Classless Inter-Domain Routing)**: Variable-length subnet masking. Notation: IP/prefix (e.g., 192.168.1.0/24). Subnet mask determines network vs host portion.

**Subnetting**: Borrowing host bits to create subnets. Number of subnets = 2^(borrowed bits). Hosts per subnet = 2^(host bits) - 2 (network and broadcast).

**Private IP Ranges**: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16. Not routable on internet. NAT translates to public IP.

**IPv6**: 128-bit address. Notation: 8 groups of 4 hex digits (e.g., 2001:0db8::8a2e:0370:7334). 2¹²⁸ addresses. No NAT needed, built-in IPSec, simplified header, no fragmentation at routers.

### IP Protocol

**IPv4 Header**: Version, IHL, TOS, Total Length, ID, Flags, Fragment Offset, TTL, Protocol, Header Checksum, Source IP, Destination IP, Options.

**Fragmentation**: Large packets split into fragments at routers. Reassembled at destination. MTU (Maximum Transmission Unit) — Ethernet MTU = 1500 bytes. Path MTU Discovery avoids fragmentation.

**ICMP (Internet Control Message Protocol)**: Error reporting and diagnostics. Ping (echo request/reply), Traceroute (TTL exceeded messages), Destination Unreachable, Time Exceeded.

**ARP (Address Resolution Protocol)**: Maps IP address to MAC address. ARP request broadcast, ARP reply unicast. ARP cache stores recent mappings.

**NAT (Network Address Translation)**: Translates private IPs to public IPs. Types: Static NAT (1:1), Dynamic NAT (pool), PAT/NAPT (port-based, many:1 — most common).

### Routing

**Routing**: Determining the best path for packets from source to destination.

**Static vs Dynamic Routing**: Static — manually configured. Dynamic — protocols automatically discover and adapt to topology changes.

**Distance Vector Routing**: Each router knows distance to all destinations via neighbors. Bellman-Ford algorithm. Exchange distance vectors with neighbors. Problems: Count-to-infinity, routing loops. Solutions: Split horizon, poison reverse, triggered updates. Protocol: **RIP (Routing Information Protocol)** — hop count metric, max 15 hops, updates every 30 seconds.

**Link State Routing**: Each router knows complete network topology. Dijkstra's algorithm for shortest path. Routers flood Link State Advertisements (LSAs). Protocol: **OSPF (Open Shortest Path First)** — cost metric, hierarchical (areas), fast convergence.

**Path Vector Routing**: Used between autonomous systems. Protocol: **BGP (Border Gateway Protocol)** — the internet's backbone routing protocol. Policy-based routing. AS path attribute prevents loops.

## 5. Transport Layer

### TCP (Transmission Control Protocol)

**Connection-oriented**, reliable, byte-stream service. Full duplex.

**3-Way Handshake (Connection Setup)**: SYN → SYN+ACK → ACK. Establishes sequence numbers and connection parameters.

**4-Way Handshake (Connection Teardown)**: FIN → ACK → FIN → ACK. TIME-WAIT state at initiator (2 × MSL).

**TCP Header**: Source Port, Dest Port, Sequence Number, ACK Number, Data Offset, Flags (SYN, ACK, FIN, RST, PSH, URG), Window Size, Checksum, Urgent Pointer, Options.

**Reliable Data Transfer**: Sequence numbers, ACKs, retransmission on timeout. Cumulative ACK — acknowledges all bytes up to the ACK number.

**Flow Control**: Sliding window based on receiver's advertised window (rwnd). Prevents sender from overwhelming receiver. Silly window syndrome avoidance (Nagle's algorithm, Clark's solution).

**Congestion Control**:
- **Slow Start**: cwnd starts at 1 MSS, doubles every RTT (exponential growth until ssthresh)
- **Congestion Avoidance**: Linear growth (cwnd += 1 MSS per RTT) after ssthresh
- **Fast Retransmit**: On 3 duplicate ACKs, retransmit without waiting for timeout
- **Fast Recovery**: After fast retransmit, set ssthresh = cwnd/2, cwnd = ssthresh + 3, continue with congestion avoidance (TCP Reno). TCP Tahoe goes back to slow start.

### UDP (User Datagram Protocol)

**Connectionless**, unreliable, message-oriented. No handshake, no flow/congestion control, no ordering guarantee.

**Header**: Source Port (2B), Dest Port (2B), Length (2B), Checksum (2B). Minimal overhead (8 bytes vs TCP's 20+).

**Use Cases**: DNS, DHCP, VoIP, video streaming, online gaming, IoT — where speed matters more than reliability.

## 6. Application Layer Protocols

**DNS (Domain Name System)**: Resolves domain names to IP addresses. Hierarchical namespace. Query types: iterative, recursive. Record types: A (IPv4), AAAA (IPv6), CNAME (alias), MX (mail), NS (nameserver), SOA, PTR (reverse), TXT, SRV.

**HTTP (HyperText Transfer Protocol)**: Request/response protocol. Methods: GET, POST, PUT, DELETE, HEAD, OPTIONS, PATCH. Status codes: 1xx (info), 2xx (success — 200 OK), 3xx (redirect — 301, 304), 4xx (client error — 400, 403, 404), 5xx (server error — 500, 502, 503). HTTP/2: multiplexing, header compression, server push. HTTP/3: QUIC over UDP.

**FTP (File Transfer Protocol)**: Control connection (port 21), Data connection (port 20 active / ephemeral passive). Active vs Passive mode. Commands: USER, PASS, LIST, RETR, STOR, QUIT.

**SMTP (Simple Mail Transfer Protocol)**: Email sending. Port 25 (relay), 587 (submission). Commands: HELO/EHLO, MAIL FROM, RCPT TO, DATA, QUIT. POP3 (port 110) and IMAP (port 143) for retrieving email.

**DHCP (Dynamic Host Configuration Protocol)**: Automatic IP assignment. DORA process: Discover (broadcast) → Offer → Request → Acknowledge. Leases IP for a period.

**SNMP (Simple Network Management Protocol)**: Network monitoring. Manager queries agents. MIB (Management Information Base). Operations: GET, SET, TRAP.

**SSH (Secure Shell)**: Encrypted remote login and command execution. Port 22. Replaces Telnet. Key-based or password authentication.

## 7. Wireless Networks (IEEE 802.11)

**Wi-Fi Standards**: 802.11a (5GHz, 54Mbps), 802.11b (2.4GHz, 11Mbps), 802.11g (2.4GHz, 54Mbps), 802.11n (Wi-Fi 4, 2.4/5GHz, 600Mbps, MIMO), 802.11ac (Wi-Fi 5, 5GHz, 6.93Gbps, MU-MIMO), 802.11ax (Wi-Fi 6, 2.4/5GHz, 9.6Gbps, OFDMA).

**Hidden Terminal Problem**: Two stations can't hear each other but interfere at the receiver. Solved by RTS/CTS mechanism.

**Wi-Fi Security**: WEP (broken), WPA (TKIP — deprecated), WPA2 (AES-CCMP — current minimum), WPA3 (SAE/Dragonfly — latest).
