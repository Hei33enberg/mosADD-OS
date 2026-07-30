/**
 * mosadd canonical threat-event taxonomy.
 *
 * The full catalog of threat-event types the mosadd radar recognises. `THREAT_EVENTS`
 * is the single source of truth — read `THREAT_EVENTS.length` (or `PLATFORM_EVENT_COUNTS.total`)
 * for the exact count rather than hardcoding a number.
 *
 * Each event has:
 *  - category: intelligence discipline (SPYWARE/SIGINT/COMINT/ELINT/MASINT/CYBER/BEHAVIORAL/PRIVACY/OSINT/MPOST)
 *  - severity: default severity tier (runtime scoring can override)
 *  - autoActions: the RECOMMENDED policy for a host that chooses to act (see the
 *    warning on `AutoAction` — nothing in mosADD executes these today)
 *  - platforms: which platforms can detect this event (apk/ios/pwa/harmony/desktop)
 *
 * ⚠️ A TAXONOMY ENTRY IS NOT A DETECTOR. This catalog is the map of events the engine
 * can *classify*. Whether any given event is *emitted* depends on a collector being
 * wired to a real sensor on a real platform — far fewer than the catalog size. Never
 * describe the catalog size as a number of detections, signals, or things "detected".
 * See ../README.md → "Coverage today" for what actually fires.
 *
 * Pairs with `evaluateEvent()` (the pure decision engine) in ./index.ts.
 */

export type EventCategory = 'COMINT' | 'ELINT' | 'MASINT' | 'CYBER' | 'BEHAVIORAL' | 'PRIVACY' | 'SIGINT' | 'OSINT' | 'MPOST' | 'SPYWARE';

export type EventSeverity = 'info' | 'warning' | 'elevated' | 'critical' | 'killswitch';

/**
 * The recommended policy attached to a taxonomy entry.
 *
 * ⚠️ ADVISORY ONLY. mosADD does NOT execute these. `evaluateEvent()` never returns
 * them (it returns a `ThreatAction`), and the `threat_classify` MCP tool deliberately
 * answers `action: "monitor"`. `disconnect_call`, `destroy_room` and `wipe_account`
 * describe what a stricter host *could* choose to do with its own authority — no
 * mosADD code path disconnects a call, destroys a room, or wipes an account. mLIDAR
 * is signal-only by design.
 */
export type AutoAction = 'log' | 'alert_user' | 'increase_sampling' | 'disconnect_call' | 'destroy_room' | 'wipe_account';

export type Platform = 'apk' | 'ios' | 'pwa' | 'harmony' | 'desktop';

export interface ThreatEventDef {
    id: string;
    category: EventCategory;
    severity: EventSeverity;
    autoActions: AutoAction[];
    label: string;
    platforms: Platform[];
}

// ── SEVERITY → ACTION MATRIX ──
// GREEN  (info)       0-20   → log only
// YELLOW (warning)    21-50  → alert_user
// ORANGE (elevated)   51-75  → alert_user + increase_sampling
// RED    (critical)   76-90  → disconnect_call + destroy_room
// BLACK  (killswitch) 91-100 → wipe_account

const LOG: AutoAction[] = ['log'];
const ALERT: AutoAction[] = ['alert_user'];
const ELEVATE: AutoAction[] = ['alert_user', 'increase_sampling'];
const DISCONNECT: AutoAction[] = ['alert_user', 'disconnect_call', 'destroy_room'];
const KILL: AutoAction[] = ['wipe_account'];

const ALL: Platform[] = ['apk', 'ios', 'pwa'];
const NATIVE: Platform[] = ['apk', 'ios'];
const APK_ONLY: Platform[] = ['apk'];
const IOS_ONLY: Platform[] = ['ios'];
const HARMONY: Platform[] = ['harmony'];
const SERVER: Platform[] = ['pwa']; // server-side events (edge functions)
const DESKTOP_ONLY: Platform[] = ['desktop']; // Electron main-process OS signals
const DESK_APK: Platform[] = ['desktop', 'apk']; // IOC-matchable on both computer + phone

function def(id: string, category: EventCategory, severity: EventSeverity, autoActions: AutoAction[], label: string, platforms: Platform[] = ALL): ThreatEventDef {
    return { id, category, severity, autoActions, label, platforms };
}

export const THREAT_EVENTS: ThreatEventDef[] = [
    // ── SIGINT — signals & device ──
    // NOTE: block headers describe the BLOCK, not the category total. Later blocks
    // (Android/iOS/Harmony/correlations) add to these categories too. For real
    // per-category totals read CATEGORY_EVENT_COUNTS — never a comment.
    def('SMS_RECEIVED', 'SIGINT', 'info', LOG, 'SMS received', NATIVE),
    def('NET_SAMPLE', 'SIGINT', 'info', LOG, 'Network sample'),
    def('NETWORK_SCAN', 'SIGINT', 'info', LOG, 'Network scan'),
    def('MIC_ACCESS', 'SIGINT', 'warning', ALERT, 'Microphone access'),
    def('CAMERA_ACCESS', 'SIGINT', 'warning', ALERT, 'Camera access'),
    def('BOOT_EVENT', 'SIGINT', 'info', LOG, 'Boot event', NATIVE),
    def('WAKELOCK', 'SIGINT', 'info', LOG, 'Wake lock acquired', NATIVE),
    def('PERMISSION_CHECK', 'SIGINT', 'info', LOG, 'Permission check'),
    def('LOCATION_ACCESS', 'SIGINT', 'warning', ALERT, 'Location access'),
    def('MAGNETOMETER_READ', 'SIGINT', 'info', LOG, 'Magnetometer', NATIVE),
    def('ACCELEROMETER_READ', 'SIGINT', 'info', LOG, 'Accelerometer', NATIVE),
    def('GYROSCOPE_READ', 'SIGINT', 'info', LOG, 'Gyroscope', NATIVE),
    def('PROXIMITY_SENSOR', 'SIGINT', 'info', LOG, 'Proximity sensor', NATIVE),
    def('AMBIENT_LIGHT', 'SIGINT', 'info', LOG, 'Ambient light', NATIVE),
    def('BAROMETER_READ', 'SIGINT', 'info', LOG, 'Barometer', NATIVE),
    def('NFC_SCAN', 'SIGINT', 'warning', ALERT, 'NFC scan', NATIVE),
    def('DNS_QUERY', 'SIGINT', 'info', LOG, 'DNS query'),
    def('BLUETOOTH_SCAN', 'SIGINT', 'info', LOG, 'Bluetooth scan', NATIVE),
    def('WIFI_PROBE', 'SIGINT', 'info', LOG, 'WiFi probe', NATIVE),
    def('VPN_STATUS', 'SIGINT', 'info', LOG, 'VPN status change', NATIVE),
    def('CERTIFICATE_CHECK', 'SIGINT', 'info', LOG, 'Certificate check'),
    def('CLIPBOARD_ACCESS', 'SIGINT', 'warning', ALERT, 'Clipboard access'),
    def('NOTIFICATION_READ', 'SIGINT', 'warning', ALERT, 'Notification read', NATIVE),
    def('ACCESSIBILITY_EVENT', 'SIGINT', 'elevated', ELEVATE, 'Accessibility event', APK_ONLY),
    def('USB_CONNECTION', 'SIGINT', 'warning', ALERT, 'USB connection', NATIVE),
    def('BATTERY_ANOMALY', 'SIGINT', 'warning', ALERT, 'Battery anomaly', NATIVE),
    def('CRYPTO_OPERATION', 'SIGINT', 'info', LOG, 'Crypto operation'),
    def('KEYSTORE_ACCESS', 'SIGINT', 'warning', ALERT, 'Keystore access', NATIVE),
    def('IMSI_CATCHER_SCAN', 'SIGINT', 'critical', DISCONNECT, 'IMSI catcher scan', NATIVE),
    def('CELL_TOWER_CHANGE', 'SIGINT', 'elevated', ELEVATE, 'Cell tower change', NATIVE),
    def('SS7_PROBE', 'SIGINT', 'critical', DISCONNECT, 'SS7 probe detected', NATIVE),
    def('BASEBAND_ANOMALY', 'SIGINT', 'critical', DISCONNECT, 'Baseband anomaly', NATIVE),
    def('ULTRASONIC_BEACON', 'SIGINT', 'elevated', ELEVATE, 'Ultrasonic beacon', NATIVE),
    def('SCREEN_CAPTURE', 'SIGINT', 'elevated', ELEVATE, 'Screen capture'),
    def('CALL_INTERCEPT', 'SIGINT', 'critical', DISCONNECT, 'Call intercept', NATIVE),
    def('SIM_SWAP_CHECK', 'SIGINT', 'critical', DISCONNECT, 'SIM swap detected', NATIVE),
    def('GEOFENCE_BREACH', 'SIGINT', 'warning', ALERT, 'Geofence breach'),
    def('KERNEL_CHECK', 'SIGINT', 'warning', ALERT, 'Kernel integrity', NATIVE),
    def('PROCESS_INJECTION', 'SIGINT', 'critical', DISCONNECT, 'Process injection', NATIVE),
    def('ROOT_DETECTION', 'SIGINT', 'elevated', ELEVATE, 'Root detected', NATIVE),
    def('FIRMWARE_VERIFY', 'SIGINT', 'warning', ALERT, 'Firmware verify', NATIVE),
    def('THERMAL_ANOMALY', 'SIGINT', 'elevated', ELEVATE, 'Thermal anomaly — abnormal device heat', NATIVE),
    def('BMS_THERMAL_RUNAWAY', 'SIGINT', 'killswitch', KILL, 'BMS thermal runaway — battery explosion risk', NATIVE),
    def('CPU_THERMAL_THROTTLE', 'SIGINT', 'warning', ALERT, 'CPU thermal throttle detected', NATIVE),
    def('GPU_THERMAL_SPIKE', 'SIGINT', 'elevated', ELEVATE, 'GPU thermal spike — workload surge', NATIVE),
    def('BATTERY_THERMAL_CRITICAL', 'SIGINT', 'critical', DISCONNECT, 'Battery temp critical — cease charging', NATIVE),
    def('CHARGING_ANOMALY', 'SIGINT', 'warning', ALERT, 'Charging anomaly — voltage/current irregular', NATIVE),
    def('TOR_EXIT_NODE', 'SIGINT', 'elevated', ELEVATE, 'TOR exit node'),
    def('PACKET_INSPECTION', 'SIGINT', 'elevated', ELEVATE, 'Deep packet inspection'),
    def('ARP_SPOOF_CHECK', 'SIGINT', 'elevated', ELEVATE, 'ARP spoofing'),
    def('STINGRAY_DETECT', 'SIGINT', 'killswitch', KILL, 'Stingray detected', NATIVE),
    def('FACE_UNLOCK_ANOMALY', 'SIGINT', 'warning', ALERT, 'Face unlock anomaly', NATIVE),
    def('FINGERPRINT_ACCESS', 'SIGINT', 'info', LOG, 'Fingerprint access', NATIVE),
    def('VOICE_PATTERN_CHECK', 'SIGINT', 'warning', ALERT, 'Voice pattern mismatch'),
    def('FILE_EXFILTRATION', 'SIGINT', 'critical', DISCONNECT, 'File exfiltration'),
    def('PHOTO_METADATA_SCAN', 'SIGINT', 'info', LOG, 'Photo metadata scan'),
    def('APP_SIDELOAD_CHECK', 'SIGINT', 'warning', ALERT, 'Sideloaded app detected', APK_ONLY),
    def('MOCK_LOCATION', 'SIGINT', 'elevated', ELEVATE, 'Mock location detected', APK_ONLY),
    def('USB_DEBUG_ENABLED', 'SIGINT', 'elevated', ELEVATE, 'USB debugging enabled', APK_ONLY),
    def('DEVELOPER_OPTIONS', 'SIGINT', 'warning', ALERT, 'Developer options active', APK_ONLY),
    def('SCREEN_RECORDING', 'SIGINT', 'elevated', ELEVATE, 'Screen recording detected'),
    def('AUDIO_ROUTING_CHANGE', 'SIGINT', 'warning', ALERT, 'Audio routing change', NATIVE),
    def('ARP_TABLE_CHANGE', 'SIGINT', 'elevated', ELEVATE, 'ARP table change — MITM risk', NATIVE),
    def('INOTIFY_SYSTEM_CHANGE', 'SIGINT', 'critical', DISCONNECT, '/system partition modified', APK_ONLY),

    // ── COMINT ──
    def('RTP_STREAM_HIJACK', 'COMINT', 'critical', DISCONNECT, 'RTP stream hijack'),
    def('VOIP_MAN_IN_MIDDLE', 'COMINT', 'critical', DISCONNECT, 'VoIP MITM'),
    def('SMS_SILENT_DELIVERY', 'COMINT', 'critical', DISCONNECT, 'Silent SMS attack', NATIVE),
    def('CALL_FORWARDING_CHECK', 'COMINT', 'warning', ALERT, 'Call forwarding change', NATIVE),
    def('DTMF_INJECTION', 'COMINT', 'elevated', ELEVATE, 'DTMF injection'),
    def('SIP_ANOMALY', 'COMINT', 'elevated', ELEVATE, 'SIP anomaly'),
    def('VOLTE_DOWNGRADE', 'COMINT', 'critical', DISCONNECT, 'VoLTE forced downgrade', NATIVE),
    def('RCS_METADATA_LEAK', 'COMINT', 'warning', ALERT, 'RCS metadata leak', NATIVE),

    // ── ELINT ──
    def('RF_SPECTRUM_SCAN', 'ELINT', 'info', LOG, 'RF spectrum scan', NATIVE),
    def('EMF_ANOMALY', 'ELINT', 'elevated', ELEVATE, 'EMF anomaly', NATIVE),
    def('RADAR_PULSE_DETECT', 'ELINT', 'warning', ALERT, 'Radar pulse detected', NATIVE),
    def('JAMMING_DETECT', 'ELINT', 'critical', DISCONNECT, 'Jamming detected', NATIVE),
    def('SDR_SWEEP', 'ELINT', 'info', LOG, 'SDR sweep', NATIVE),
    def('FREQUENCY_HOPPING', 'ELINT', 'warning', ALERT, 'Frequency hopping', NATIVE),
    def('SIGNAL_TRIANGULATION', 'ELINT', 'elevated', ELEVATE, 'Signal triangulation', NATIVE),
    def('ANTENNA_PATTERN_CHANGE', 'ELINT', 'warning', ALERT, 'Antenna pattern change', NATIVE),

    // ── MASINT ──
    def('ACOUSTIC_FINGERPRINT', 'MASINT', 'warning', ALERT, 'Acoustic fingerprint', NATIVE),
    def('VIBRATION_ANALYSIS', 'MASINT', 'info', LOG, 'Vibration analysis', NATIVE),
    def('POWER_CONSUMPTION_ANOMALY', 'MASINT', 'elevated', ELEVATE, 'Power anomaly', NATIVE),
    def('ELECTROMAGNETIC_LEAK', 'MASINT', 'critical', DISCONNECT, 'EM leak', NATIVE),
    def('TEMPEST_CHECK', 'MASINT', 'critical', DISCONNECT, 'TEMPEST emanation', NATIVE),
    def('SIDE_CHANNEL_DETECT', 'MASINT', 'critical', DISCONNECT, 'Side channel attack'),
    def('CLOCK_SKEW_ANALYSIS', 'MASINT', 'warning', ALERT, 'Clock skew anomaly'),
    def('ENTROPY_POOL_CHECK', 'MASINT', 'info', LOG, 'Entropy pool check'),

    // ── CYBER — runtime attacks & anti-tamper ──
    def('MEMORY_INJECTION', 'CYBER', 'killswitch', KILL, 'Memory injection', NATIVE),
    def('HEAP_SPRAY_DETECT', 'CYBER', 'killswitch', KILL, 'Heap spray attack', NATIVE),
    def('SYSCALL_HOOKING', 'CYBER', 'killswitch', KILL, 'Syscall rootkit', APK_ONLY),
    def('DEBUGGER_ATTACH', 'CYBER', 'killswitch', KILL, 'Debugger injection', NATIVE),
    def('SANDBOX_ESCAPE', 'CYBER', 'killswitch', KILL, 'Sandbox breach', NATIVE),
    def('BOOTLOADER_UNLOCK', 'CYBER', 'killswitch', KILL, 'Bootloader compromised', NATIVE),
    def('SELINUX_VIOLATION', 'CYBER', 'critical', DISCONNECT, 'SELinux violation', APK_ONLY),
    def('CODE_SIGNING_BYPASS', 'CYBER', 'critical', DISCONNECT, 'Code signing bypass', NATIVE),
    def('RUNTIME_MANIPULATION', 'CYBER', 'critical', DISCONNECT, 'Runtime manipulation'),
    def('SHARED_LIB_HIJACK', 'CYBER', 'critical', DISCONNECT, 'Shared lib hijack', NATIVE),
    def('JIT_SPRAY_DETECT', 'CYBER', 'elevated', ELEVATE, 'JIT spray detected'),
    def('SPECTRE_MITIGATION_CHECK', 'CYBER', 'info', LOG, 'Spectre mitigation'),
    def('FRIDA_DETECTION', 'CYBER', 'killswitch', KILL, 'Frida instrumentation detected', NATIVE),
    def('XPOSED_DETECTION', 'CYBER', 'killswitch', KILL, 'Xposed framework detected', APK_ONLY),
    def('MAGISK_DETECTION', 'CYBER', 'killswitch', KILL, 'Magisk root detected', APK_ONLY),
    def('OVERLAY_ATTACK', 'CYBER', 'critical', DISCONNECT, 'Overlay/tapjacking attack', NATIVE),
    def('CERTIFICATE_PINNING_FAIL', 'CYBER', 'critical', DISCONNECT, 'SSL certificate pinning failure'),

    // ── BEHAVIORAL ──
    def('TYPING_PATTERN_CHANGE', 'BEHAVIORAL', 'warning', ALERT, 'Typing pattern change'),
    def('GAIT_ANALYSIS', 'BEHAVIORAL', 'info', LOG, 'Gait analysis', NATIVE),
    def('USAGE_TIME_ANOMALY', 'BEHAVIORAL', 'info', LOG, 'Usage time anomaly'),
    def('APP_SWITCH_PATTERN', 'BEHAVIORAL', 'info', LOG, 'App switch pattern'),
    def('SLEEP_WAKE_ANOMALY', 'BEHAVIORAL', 'warning', ALERT, 'Sleep/wake anomaly'),
    def('BEHAVIORAL_ANOMALY', 'BEHAVIORAL', 'info', LOG, 'Behavioral anomaly'),

    // ── PRIVACY ──
    def('AD_TRACKER_DETECT', 'PRIVACY', 'warning', ALERT, 'Ad tracker detected'),
    def('CANVAS_FINGERPRINT', 'PRIVACY', 'elevated', ELEVATE, 'Canvas fingerprinting'),
    def('WEBRTC_LEAK', 'PRIVACY', 'elevated', ELEVATE, 'WebRTC leak'),
    def('DEVICE_FINGERPRINT_CHECK', 'PRIVACY', 'warning', ALERT, 'Device fingerprinting'),
    def('CROSS_APP_TRACKING', 'PRIVACY', 'elevated', ELEVATE, 'Cross-app tracking'),
    def('CAMERA_INDICATOR_BYPASS', 'PRIVACY', 'critical', DISCONNECT, 'Camera indicator bypass'),
    def('MIC_INDICATOR_BYPASS', 'PRIVACY', 'critical', DISCONNECT, 'Mic indicator bypass'),

    // ── OSINT — open source intelligence ──
    def('EMAIL_BREACH_CHECK', 'OSINT', 'warning', ALERT, 'Email found in breach DB'),
    def('DARK_WEB_MENTION', 'OSINT', 'elevated', ELEVATE, 'Identity mentioned on dark web'),
    def('PUBLIC_DATA_EXPOSURE', 'OSINT', 'warning', ALERT, 'Public data exposure detected'),

    // ── MPOST — mp0st email tracking intel ──
    def('MPOST_INBOUND_RECEIVED', 'MPOST', 'info', LOG, 'Inbound email received', SERVER),
    def('MPOST_SENT', 'MPOST', 'info', LOG, 'Outbound email sent', SERVER),
    def('MPOST_DELIVERED', 'MPOST', 'info', LOG, 'Email delivered to recipient', SERVER),
    def('MPOST_PIXEL_OPEN', 'MPOST', 'warning', ALERT, 'Email opened — tracking pixel fired', SERVER),
    def('MPOST_LINK_CLICK', 'MPOST', 'warning', ALERT, 'Email link clicked — tracking event', SERVER),
    def('MPOST_BOUNCED', 'MPOST', 'warning', ALERT, 'Email bounced — delivery failed', SERVER),
    def('MPOST_COMPLAINED', 'MPOST', 'critical', DISCONNECT, 'Email reported as spam', SERVER),
    def('MPOST_FORWARDED', 'MPOST', 'elevated', ELEVATE, 'Email forwarded to third party', SERVER),

    // ── HARMONY — HarmonyOS-specific ──
    def('HARMONY_DISTRIBUTED_DEVICE', 'SIGINT', 'info', LOG, 'HarmonyOS distributed device event', HARMONY),
    def('HEART_RATE_ANOMALY', 'MASINT', 'warning', ALERT, 'Heart rate anomaly detected', HARMONY),

    // ── ANDROID LIFECYCLE & OS (Behavioral / Sigint) ──
    def('APP_IMPORTANCE_CHANGE', 'BEHAVIORAL', 'info', LOG, 'App importance changed', APK_ONLY),
    def('APP_STANDBY_BUCKET_CHANGE', 'BEHAVIORAL', 'info', LOG, 'App standby bucket changed', APK_ONLY),
    def('DOZE_MODE_EVENT', 'MASINT', 'warning', ALERT, 'Doze mode state changed', APK_ONLY),
    def('POWER_SAVE_MODE_CHANGE', 'MASINT', 'info', LOG, 'Power save mode changed', APK_ONLY),
    def('FOREGROUND_SERVICE_CHANGE', 'SIGINT', 'info', LOG, 'Foreground service start/stop', APK_ONLY),
    def('JOB_SCHEDULER_JOB_FAILURE', 'BEHAVIORAL', 'warning', ALERT, 'Job scheduler repeated failure', APK_ONLY),
    def('THERMAL_STATUS_CHANGE', 'MASINT', 'warning', ALERT, 'Thermal status API change', APK_ONLY),
    def('MEMORY_TRIM_EVENT', 'BEHAVIORAL', 'warning', ALERT, 'Memory trim event (low mem)', APK_ONLY),
    def('PACKAGE_CHANGE', 'CYBER', 'warning', ALERT, 'High-risk package installed/removed', APK_ONLY),
    def('SCREEN_PRESENCE_CHANGE', 'BEHAVIORAL', 'info', LOG, 'User present / screen off', APK_ONLY),

    // ── ANDROID MASINT / SENSORS ──
    def('DEVICE_ORIENTATION_LOCK', 'MASINT', 'warning', ALERT, 'Device orientation forced lock', APK_ONLY),
    def('MICRO_MOTION_PATTERN', 'MASINT', 'elevated', ELEVATE, 'Micro motion / tripod detection', APK_ONLY),
    def('AMBIENT_PROFILE_SHIFT', 'MASINT', 'warning', ALERT, 'Ambient profile sudden shift', APK_ONLY),
    def('PROXIMITY_STUCK', 'MASINT', 'warning', ALERT, 'Proximity sensor stuck on', APK_ONLY),
    def('HALL_SENSOR_EVENT', 'MASINT', 'info', LOG, 'Hall sensor (case/dock) event', APK_ONLY),
    def('STEP_PATTERN_ANOMALY', 'BEHAVIORAL', 'warning', ALERT, 'Step pattern anomaly', APK_ONLY),

    // ── IOS LIFECYCLE & SYNC ──
    def('BG_TASK_TIMEOUT', 'BEHAVIORAL', 'warning', ALERT, 'Background task timeout', IOS_ONLY),
    def('LOW_MEMORY_WARNING', 'BEHAVIORAL', 'critical', DISCONNECT, 'Low memory warning', IOS_ONLY),
    def('BACKGROUND_FETCH_RATE_DROP', 'COMINT', 'warning', ALERT, 'Background fetch rate drop', IOS_ONLY),
    def('PUSH_DELIVERY_GAP', 'COMINT', 'elevated', ELEVATE, 'Push delivery gap anomaly', IOS_ONLY),
    def('BLUEOOTH_BG_EVENT', 'ELINT', 'warning', ALERT, 'Bluetooth background event', IOS_ONLY),
    def('SIGNIFICANT_LOCATION_EVENT', 'SIGINT', 'info', LOG, 'Significant location change', IOS_ONLY),
    def('CALLKIT_STATE_ANOMALY', 'COMINT', 'warning', ALERT, 'CallKit state anomaly', IOS_ONLY),

    // ── IOS MASINT & BEHAVIORAL ──
    def('MOTION_ACTIVITY_MISMATCH', 'BEHAVIORAL', 'elevated', ELEVATE, 'Motion activity mismatch', IOS_ONLY),
    def('DEVICE_STATIONARY_LONG', 'MASINT', 'elevated', ELEVATE, 'Device stationary abnormally long', IOS_ONLY),
    def('EARPHONE_PLUG_PATTERN', 'COMINT', 'warning', ALERT, 'Earphone plug pattern anomaly', IOS_ONLY),

    // ── HARMONY OS SPECIFIC (New) ──
    def('HMOS_DISTRIBUTED_SESSION_MOVE', 'SIGINT', 'elevated', ELEVATE, 'Session moved to distributed device', HARMONY),
    def('HMOS_DEVICE_TRUST_CHANGED', 'CYBER', 'critical', DISCONNECT, 'Device trust level changed', HARMONY),
    def('HMOS_SENSOR_PROFILE_CHANGE', 'MASINT', 'warning', ALERT, 'Sensor profile change', HARMONY),
    def('HMOS_PERMISSION_ESCALATION', 'CYBER', 'critical', DISCONNECT, 'Permission escalation detected', HARMONY),

    // ── CROSS-PLATFORM LOGIC / CORRELATIONS ──
    def('SESSION_PERSISTENCE_ANOMALY', 'CYBER', 'killswitch', KILL, 'Session persistence anomaly', NATIVE),
    def('POWER_PROFILE_MISMATCH', 'MASINT', 'elevated', ELEVATE, 'Power profile mismatch', NATIVE),
    def('SENSOR_ENV_MISMATCH', 'MASINT', 'elevated', ELEVATE, 'Sensor environment mismatch', NATIVE),
    def('RF_JAMMING_CORRELATED', 'ELINT', 'killswitch', KILL, 'RF Jamming correlated with packet loss', NATIVE),
    def('MULTI_DEVICE_SHADOWING', 'SIGINT', 'killswitch', KILL, 'Multi-device shadowing detected', NATIVE),

    // ── mLIDAR · SPYWARE / PEGASUS (IOC-based, the Amnesty-MVT / iVerify method) ──
    // Alert-level auto-actions only — no auto-wipe. A confirmed compromise raises a
    // CRITICAL alert plus recommended actions; mLIDAR itself never acts.
    def('PEGASUS_C2_BEACON', 'SPYWARE', 'critical', ELEVATE, 'Beacon to known Pegasus C2', DESK_APK),
    def('SPYWARE_C2_BEACON', 'SPYWARE', 'critical', ELEVATE, 'Beacon to known mercenary-spyware C2', DESK_APK),
    def('SPYWARE_PROCESS_MATCH', 'SPYWARE', 'critical', ELEVATE, 'Known spyware process running', DESK_APK),
    def('SPYWARE_PACKAGE_MATCH', 'SPYWARE', 'critical', ELEVATE, 'Known spyware package installed', APK_ONLY),
    def('ROGUE_CONFIG_PROFILE', 'SPYWARE', 'elevated', ELEVATE, 'Rogue configuration / MDM profile', DESK_APK),
    def('SPYWARE_ARTIFACT_PATH', 'SPYWARE', 'elevated', ELEVATE, 'Known spyware artifact on disk', DESKTOP_ONLY),
    def('MERCENARY_EXPLOIT_TRACE', 'SPYWARE', 'critical', ELEVATE, 'Mercenary-spyware exploit trace', DESK_APK),

    // ── mLIDAR · DESKTOP (Electron main-process OS security posture) ──
    def('DESK_SUSPICIOUS_PROCESS', 'CYBER', 'warning', ALERT, 'Suspicious process', DESKTOP_ONLY),
    def('DESK_NEW_LISTENING_PORT', 'CYBER', 'warning', ALERT, 'New listening port', DESKTOP_ONLY),
    def('DESK_UNKNOWN_OUTBOUND', 'CYBER', 'warning', ALERT, 'Unknown outbound connection', DESKTOP_ONLY),
    def('DESK_USB_ATTACHED', 'SIGINT', 'info', LOG, 'USB device attached', DESKTOP_ONLY),
    def('DESK_DISK_UNENCRYPTED', 'CYBER', 'elevated', ELEVATE, 'Disk not encrypted', DESKTOP_ONLY),
    def('DESK_FIREWALL_OFF', 'CYBER', 'elevated', ELEVATE, 'Firewall disabled', DESKTOP_ONLY),
    def('DESK_AV_OFF', 'CYBER', 'elevated', ELEVATE, 'Antivirus / Defender disabled', DESKTOP_ONLY),
    def('DESK_REMOTE_ACCESS_ON', 'CYBER', 'elevated', ELEVATE, 'Remote access (RDP/SSH) enabled', DESKTOP_ONLY),
    def('DESK_SCREEN_RECORDING', 'PRIVACY', 'warning', ALERT, 'Screen recording active', DESKTOP_ONLY),
    def('DESK_CAM_MIC_IN_USE', 'PRIVACY', 'warning', ALERT, 'Camera / microphone in use', DESKTOP_ONLY),
    def('DESK_AUTORUN_ADDED', 'CYBER', 'warning', ALERT, 'New autorun / startup item', DESKTOP_ONLY),
    def('DESK_NEW_ROOT_CERT', 'CYBER', 'elevated', ELEVATE, 'New root certificate installed', DESKTOP_ONLY),
    def('DESK_SECUREBOOT_OFF', 'CYBER', 'elevated', ELEVATE, 'Secure Boot disabled', DESKTOP_ONLY),
    def('DESK_OS_OUTDATED', 'CYBER', 'warning', ALERT, 'OS missing security updates', DESKTOP_ONLY),
    def('DESK_VPN_OFF', 'SIGINT', 'info', LOG, 'VPN disconnected', DESKTOP_ONLY),
    def('DESK_ADMIN_SESSION', 'CYBER', 'info', LOG, 'Elevated / admin session', DESKTOP_ONLY),

    // ── mLIDAR · ANDROID (Capacitor native posture; distinct ids from the SIGINT block) ──
    def('DEV_OPTIONS_ENABLED', 'CYBER', 'warning', ALERT, 'Developer options enabled', APK_ONLY),
    def('ACCESSIBILITY_ABUSE', 'CYBER', 'elevated', ELEVATE, 'Suspicious accessibility service', APK_ONLY),
    def('DEVICE_ADMIN_ADDED', 'CYBER', 'elevated', ELEVATE, 'New device-admin app', APK_ONLY),
    def('SIDELOAD_SOURCE', 'CYBER', 'info', LOG, 'App installed outside the store', APK_ONLY),
];

// ── Helpers ──

export const EVENT_BY_ID = new Map(THREAT_EVENTS.map(e => [e.id, e]));

export function getEventDef(id: string): ThreatEventDef | undefined {
    return EVENT_BY_ID.get(id);
}

export const CATEGORIES: EventCategory[] = ['SPYWARE', 'SIGINT', 'COMINT', 'ELINT', 'MASINT', 'CYBER', 'BEHAVIORAL', 'PRIVACY', 'OSINT', 'MPOST'];

export const CATEGORY_LABELS: Record<EventCategory, string> = {
    SPYWARE: 'SPYWARE',
    SIGINT: 'SIGINT',
    COMINT: 'COMINT',
    ELINT: 'ELINT',
    MASINT: 'MASINT',
    CYBER: 'CYBER',
    BEHAVIORAL: 'BEHAV.',
    PRIVACY: 'PRIV.',
    OSINT: 'OSINT',
    MPOST: 'mp0st',
};

export const SEVERITY_SCORE: Record<EventSeverity, number> = {
    info: 5,
    warning: 30,
    elevated: 60,
    critical: 85,
    killswitch: 100,
};

export const KILLSWITCH_EVENT_IDS = THREAT_EVENTS
    .filter(e => e.severity === 'killswitch')
    .map(e => e.id);

export const AUTO_DISCONNECT_EVENT_IDS = THREAT_EVENTS
    .filter(e => e.autoActions.includes('disconnect_call'))
    .map(e => e.id);

export function getEventsByCategory(category: EventCategory): ThreatEventDef[] {
    return THREAT_EVENTS.filter(e => e.category === category);
}

export function getEventsByPlatform(platform: Platform): ThreatEventDef[] {
    return THREAT_EVENTS.filter(e => e.platforms.includes(platform));
}

export function isAvailableOnPwa(eventId: string): boolean {
    const ev = EVENT_BY_ID.get(eventId);
    return ev ? ev.platforms.includes('pwa') : false;
}

/** Per-platform and total event counts (derived from THREAT_EVENTS — the source of truth). */
export const PLATFORM_EVENT_COUNTS = {
    apk: THREAT_EVENTS.filter(e => e.platforms.includes('apk')).length,
    ios: THREAT_EVENTS.filter(e => e.platforms.includes('ios')).length,
    pwa: THREAT_EVENTS.filter(e => e.platforms.includes('pwa')).length,
    harmony: THREAT_EVENTS.filter(e => e.platforms.includes('harmony')).length,
    desktop: THREAT_EVENTS.filter(e => e.platforms.includes('desktop')).length,
    total: THREAT_EVENTS.length,
} as const;

/**
 * Per-category event counts, derived from THREAT_EVENTS.
 *
 * Read this instead of writing a number in prose — every stale count in this repo's
 * history came from a human typing a total into a comment or a README.
 */
export const CATEGORY_EVENT_COUNTS: Record<EventCategory, number> = CATEGORIES.reduce(
    (acc, c) => { acc[c] = THREAT_EVENTS.filter(e => e.category === c).length; return acc; },
    {} as Record<EventCategory, number>,
);

