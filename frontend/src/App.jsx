import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import {
  BadgeCheck,
  ShieldCheck,
  BrainCircuit,
  MapPin,
  Radar,
  Siren,
  Shield,
  ScanSearch,
  Square,
  LockKeyhole,
  Map,
  AlertTriangle,
} from "lucide-react";

import "./App.css";

// ====================================================
// API URL
// ====================================================

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "/api" : "http://127.0.0.1:8000/api");

// ====================================================
// Fix Leaflet marker icons
// ====================================================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ====================================================
// Map Updater
// ====================================================

function MapUpdater({ center }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);

  return null;
}

// ====================================================
// Generate Dynamic Safety Zones
// Demo zones generated around selected destination
// ====================================================

const generateSafetyZones = (
  latitude,
  longitude,
  destination
) => {
  return [
    {
      name: `${destination} Safe Zone`,
      latitude: latitude + 0.01,
      longitude: longitude + 0.01,
      radius: 2500,
      risk: "SAFE",
      score: 100,
      message:
        "This area is marked as a low-risk demonstration safety zone.",
    },

    {
      name: `${destination} Caution Zone`,
      latitude: latitude - 0.012,
      longitude: longitude + 0.008,
      radius: 1800,
      risk: "CAUTION",
      score: 70,
      message:
        "Caution zone detected. Please remain alert and aware of your surroundings.",
    },

    {
      name: `${destination} High Risk Zone`,
      latitude: latitude + 0.008,
      longitude: longitude - 0.015,
      radius: 1500,
      risk: "HIGH RISK",
      score: 35,
      message:
        "High-risk demonstration zone. Consider moving toward a safer area.",
    },
  ];
};

// ====================================================
// Main App
// ====================================================

function App() {
  // --------------------------------------------------
  // System Status
  // --------------------------------------------------

  const [status, setStatus] = useState(
    "Checking system..."
  );

  // --------------------------------------------------
  // Registration
  // --------------------------------------------------

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    nationality: "",
    identity_type: "Passport",
    identity_number: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    destination: "",
    entry_date: "",
    exit_date: "",
  });

  const [tourist, setTourist] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  // --------------------------------------------------
  // Blockchain Verification
  // --------------------------------------------------

  const [
    verificationResult,
    setVerificationResult,
  ] = useState(null);

  const [
    verificationLoading,
    setVerificationLoading,
  ] = useState(false);

  // --------------------------------------------------
  // Destination
  // --------------------------------------------------

  const [
    destinationLocation,
    setDestinationLocation,
  ] = useState(null);

  const [
    destinationMessage,
    setDestinationMessage,
  ] = useState("");

  const [
    safetyZones,
    setSafetyZones,
  ] = useState([]);

  // --------------------------------------------------
  // Current Location
  // --------------------------------------------------

  const [location, setLocation] =
    useState(null);

  const [
    locationMessage,
    setLocationMessage,
  ] = useState("");

  const [
    riskStatus,
    setRiskStatus,
  ] = useState(null);

  // --------------------------------------------------
  // Live Tracking
  // --------------------------------------------------

  const [tracking, setTracking] =
    useState(false);

  const [watchId, setWatchId] =
    useState(null);

  // --------------------------------------------------
  // Safety Score
  // --------------------------------------------------

  const [
    safetyScore,
    setSafetyScore,
  ] = useState(100);

  // --------------------------------------------------
  // SOS
  // --------------------------------------------------

  const [
    sosLoading,
    setSosLoading,
  ] = useState(false);

  const [
    sosMessage,
    setSosMessage,
  ] = useState("");

  const [incident, setIncident] =
    useState(null);

  // ==================================================
  // Backend Status
  // ==================================================

  useEffect(() => {
    fetch(`${API_URL}/status`)
      .then((response) =>
        response.json()
      )
      .then((data) =>
        setStatus(
          data.message ||
            "System Active"
        )
      )
      .catch(() =>
        setStatus(
          "Backend connection failed"
        )
      );
  }, []);

  // ==================================================
  // Cleanup Tracking
  // ==================================================

  useEffect(() => {
    return () => {
      if (
        watchId !== null &&
        navigator.geolocation
      ) {
        navigator.geolocation.clearWatch(
          watchId
        );
      }
    };
  }, [watchId]);

  // ==================================================
  // Smooth Scroll
  // ==================================================

  const scrollToSection = (
    sectionId
  ) => {
    document
      .getElementById(sectionId)
      ?.scrollIntoView({
        behavior: "smooth",
      });
  };

  // ==================================================
  // Form Change
  // ==================================================

  const handleChange = (
    event
  ) => {
    const { name, value } =
      event.target;

    setFormData(
      (previousData) => ({
        ...previousData,
        [name]: value,
      })
    );
  };

  // ==================================================
  // Geocode Destination
  // Uses OpenStreetMap Nominatim
  // ==================================================

  const geocodeDestination =
    async (destination) => {
      if (!destination.trim()) {
        return null;
      }

      try {
        setDestinationMessage(
          "Finding destination location..."
        );

        const query =
          encodeURIComponent(
            destination
          );

        const response =
          await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${query}`
          );

        const data =
          await response.json();

        if (
          !data ||
          data.length === 0
        ) {
          setDestinationMessage(
            "Destination not found. Please enter a more specific city or location."
          );

          return null;
        }

        const latitude =
          parseFloat(
            data[0].lat
          );

        const longitude =
          parseFloat(
            data[0].lon
          );

        const destinationData = {
          latitude,
          longitude,
          name: data[0].display_name,
        };

        setDestinationLocation(
          destinationData
        );

        const generatedZones =
          generateSafetyZones(
            latitude,
            longitude,
            destination
          );

        setSafetyZones(
          generatedZones
        );

        setDestinationMessage(
          `Destination found: ${data[0].display_name}`
        );

        return destinationData;
      } catch (error) {
        console.error(error);

        setDestinationMessage(
          "Unable to find destination. Please check your internet connection."
        );

        return null;
      }
    };

  // ==================================================
  // Register Tourist
  // ==================================================

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setLoading(true);

      setVerificationResult(
        null
      );

      try {
        // Find destination coordinates

        await geocodeDestination(
          formData.destination
        );

        // Register tourist

        const response =
          await fetch(
            `${API_URL}/register`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  formData
                ),
            }
          );

        const data =
          await response.json();

        if (data.success) {
          setTourist(
            data.tourist
          );

          setSosMessage("");

          setIncident(null);

          alert(
            "Digital Tourist ID created successfully!"
          );

          setTimeout(() => {
            scrollToSection(
              "safety-map"
            );
          }, 500);
        } else {
          alert(
            data.message ||
              "Registration failed."
          );
        }
      } catch (error) {
        console.error(error);

        alert(
          "Registration failed. Please check the backend."
        );
      } finally {
        setLoading(false);
      }
    };

  // ==================================================
  // Haversine Distance
  // ==================================================

  const calculateDistance = (
    lat1,
    lon1,
    lat2,
    lon2
  ) => {
    const R = 6371000;

    const dLat =
      ((lat2 - lat1) *
        Math.PI) /
      180;

    const dLon =
      ((lon2 - lon1) *
        Math.PI) /
      180;

    const a =
      Math.sin(dLat / 2) *
        Math.sin(dLat / 2) +
      Math.cos(
        (lat1 * Math.PI) /
          180
      ) *
        Math.cos(
          (lat2 * Math.PI) /
            180
        ) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c =
      2 *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );

    return R * c;
  };

  // ==================================================
  // Geo-Fencing Risk Detection
  // ==================================================

  const checkRiskZone = (
    newLocation
  ) => {
    let detectedRisk = {
      risk: "SAFE",
      zone: "General Area",
      message:
        "No known high-risk demonstration zone detected near your current location.",
      score: 90,
    };

    const sortedZones =
      [...safetyZones].sort(
        (a, b) =>
          a.score -
          b.score
      );

    for (
      const zone of sortedZones
    ) {
      const distance =
        calculateDistance(
          newLocation.latitude,
          newLocation.longitude,
          zone.latitude,
          zone.longitude
        );

      if (
        distance <= zone.radius
      ) {
        detectedRisk = {
          risk: zone.risk,
          zone: zone.name,
          message:
            zone.message,
          score: zone.score,
        };

        break;
      }
    }

    setRiskStatus(
      detectedRisk
    );

    setSafetyScore(
      detectedRisk.score
    );
  };

  // ==================================================
  // Update User Location
  // ==================================================

  const updateLocation = (
    position,
    isTracking = false
  ) => {
    const newLocation = {
      latitude:
        position.coords.latitude,

      longitude:
        position.coords.longitude,
    };

    setLocation(
      newLocation
    );

    setLocationMessage(
      isTracking
        ? "Live location tracking is active."
        : "Location detected successfully."
    );

    checkRiskZone(
      newLocation
    );
  };

  // ==================================================
  // Get Current Location
  // ==================================================

  const getCurrentLocation =
    () => {
      if (
        !navigator.geolocation
      ) {
        setLocationMessage(
          "Geolocation is not supported by your browser."
        );

        return;
      }

      setLocationMessage(
        "Getting your current location..."
      );

      navigator.geolocation.getCurrentPosition(
        (position) =>
          updateLocation(
            position,
            false
          ),

        () => {
          setLocationMessage(
            "Unable to get location. Please allow location permission."
          );
        },

        {
          enableHighAccuracy:
            true,

          timeout: 10000,

          maximumAge: 5000,
        }
      );
    };

  // ==================================================
  // Start Live Tracking
  // ==================================================

  const startTracking =
    () => {
      if (
        !navigator.geolocation
      ) {
        setLocationMessage(
          "Geolocation is not supported by your browser."
        );

        return;
      }

      if (tracking) return;

      setLocationMessage(
        "Starting live location tracking..."
      );

      const id =
        navigator.geolocation.watchPosition(
          (position) => {
            updateLocation(
              position,
              true
            );
          },

          () => {
            setLocationMessage(
              "Unable to track location. Please allow location permission."
            );

            setTracking(false);
          },

          {
            enableHighAccuracy:
              true,

            maximumAge: 5000,

            timeout: 10000,
          }
        );

      setWatchId(id);

      setTracking(true);
    };

  // ==================================================
  // Stop Live Tracking
  // ==================================================

  const stopTracking =
    () => {
      if (
        watchId !== null &&
        navigator.geolocation
      ) {
        navigator.geolocation.clearWatch(
          watchId
        );
      }

      setWatchId(null);

      setTracking(false);

      setLocationMessage(
        "Live location tracking stopped."
      );
    };

  // ==================================================
  // Verify Digital ID
  // ==================================================

  const verifyDigitalID =
    async () => {
      if (!tourist) {
        alert(
          "Please create your Digital ID first."
        );

        return;
      }

      setVerificationLoading(
        true
      );

      setVerificationResult(
        null
      );

      try {
        const response =
          await fetch(
            `${API_URL}/verify/${tourist.id}`
          );

        const data =
          await response.json();

        setVerificationResult(
          data
        );
      } catch (error) {
        setVerificationResult({
          success: false,

          blockchain_verified:
            false,

          message:
            "Unable to verify Digital ID.",
        });
      } finally {
        setVerificationLoading(
          false
        );
      }
    };

  // ==================================================
  // Send SOS
  // ==================================================

  const handleSOS =
    () => {
      if (!tourist) {
        alert(
          "Please register and create your Digital ID first."
        );

        scrollToSection(
          "registration"
        );

        return;
      }

      if (
        !navigator.geolocation
      ) {
        setSosMessage(
          "Geolocation is not supported by your browser."
        );

        return;
      }

      setSosLoading(true);

      setSosMessage(
        "Getting your emergency location..."
      );

      navigator.geolocation.getCurrentPosition(
        async (
          position
        ) => {
          try {
            const response =
              await fetch(
                `${API_URL}/sos`,
                {
                  method:
                    "POST",

                  headers: {
                    "Content-Type":
                      "application/json",
                  },

                  body:
                    JSON.stringify(
                      {
                        tourist_id:
                          tourist.id,

                        latitude:
                          position
                            .coords
                            .latitude,

                        longitude:
                          position
                            .coords
                            .longitude,
                      }
                    ),
                }
              );

            const data =
              await response.json();

            if (
              data.success
            ) {
              setIncident(
                data.alert
              );

              setSosMessage(
                `SOS SENT SUCCESSFULLY. Incident ID: ${data.alert.incident_id}`
              );
            } else {
              setSosMessage(
                data.message ||
                  "Failed to send SOS alert."
              );
            }
          } catch (error) {
            setSosMessage(
              "Failed to connect to the emergency service."
            );
          } finally {
            setSosLoading(
              false
            );
          }
        },

        () => {
          setSosLoading(
            false
          );

          setSosMessage(
            "Location permission denied. Unable to send location with SOS."
          );
        },

        {
          enableHighAccuracy:
            true,

          timeout: 10000,

          maximumAge: 5000,
        }
      );
    };

  // ==================================================
  // Map Helpers
  // ==================================================

  const mapCenter =
    location
      ? [
          location.latitude,
          location.longitude,
        ]
      : destinationLocation
      ? [
          destinationLocation.latitude,
          destinationLocation.longitude,
        ]
      : [
          20.5937,
          78.9629,
        ];

  const getZoneColor =
    (risk) => {
      if (
        risk === "CAUTION"
      ) {
        return "#eab308";
      }

      if (
        risk ===
        "HIGH RISK"
      ) {
        return "#ef4444";
      }

      return "#22c55e";
    };

  const getSafetyLabel =
    () => {
      if (
        safetyScore >= 80
      ) {
        return "SAFE";
      }

      if (
        safetyScore >= 50
      ) {
        return "CAUTION";
      }

      return "HIGH RISK";
    };

  // ==================================================
  // UI
  // ==================================================

  return (
    <div className="app">

      {/* ================================================
          Navigation
      ================================================= */}

      <nav className="navbar">

        <div className="logo">
          <Shield size={25} />
          <span>SafeTour</span>
        </div>

        <div className="nav-links">

          <button
            onClick={() =>
              scrollToSection(
                "home"
              )
            }
          >
            Home
          </button>

          <button
            onClick={() =>
              scrollToSection(
                "registration"
              )
            }
          >
            Digital ID
          </button>

          <button
            onClick={() =>
              scrollToSection(
                "safety-map"
              )
            }
          >
            Safety Map
          </button>

          <button
            onClick={() =>
              scrollToSection(
                "emergency"
              )
            }
          >
            Emergency
          </button>

        </div>

      </nav>


      {/* ================================================
          Hero
      ================================================= */}

      <main
        className="hero"
        id="home"
      >

        <div className="hero-content">

          <p className="tag">
            SMART TOURIST SAFETY PLATFORM
          </p>

          <h1>
            Travel Smart.
            <br />
            Stay Safe.
          </h1>

          <p className="subtitle">
            AI-powered tourist safety monitoring
            with Geo-Fencing, Digital Identity,
            Live Location Tracking, Emergency
            Response, and Tamper Protection.
          </p>

          <div className="hero-buttons">

            <button
              className="primary-btn"
              onClick={() =>
                scrollToSection(
                  "registration"
                )
              }
            >
              Create Digital ID
            </button>

            <button
              className="secondary-btn"
              onClick={() =>
                scrollToSection(
                  "safety-map"
                )
              }
            >
              View Safety Map
            </button>

          </div>

        </div>


        <div className="safety-card">

          <div className="status-icon">
            <ShieldCheck
              size={68}
              strokeWidth={1.5}
            />
          </div>

          <h2>
            Your Safety,
            <br />
            Our Priority
          </h2>

          <p>
            {status}
          </p>

          <div className="status">
            <span className="dot"></span>
            System Active
          </div>

        </div>

      </main>


      {/* ================================================
          AI Safety Score
      ================================================= */}

      <section className="safety-score-section">

        <h2>
          AI Tourist Safety Score
        </h2>

        <div className="safety-score-card">

          <div className="score-circle">

            <h1>
              {safetyScore}
            </h1>

            <p>
              /100
            </p>

          </div>

          <div>

            <h3>
              Current Status:{" "}
              {getSafetyLabel()}
            </h3>

            <p>
              The prototype calculates the safety
              score based on the tourist's current
              location relative to dynamically
              generated geo-fenced safety zones.
            </p>

          </div>

        </div>

      </section>


      {/* ================================================
          Registration
      ================================================= */}

      <section
        className="registration-section"
        id="registration"
      >

        <div className="registration-container">


          {/* Registration Form */}

          <div className="registration-form">

            <h2>
              Tourist Registration
            </h2>

            <p>
              Create a secure Digital Tourist ID.
            </p>

            <form
              onSubmit={
                handleSubmit
              }
            >

              <h3>
                Personal Information
              </h3>

              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={
                  formData.name
                }
                onChange={
                  handleChange
                }
                required
              />

              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={
                  formData.email
                }
                onChange={
                  handleChange
                }
                required
              />

              <input
                type="text"
                name="phone"
                placeholder="Phone Number"
                value={
                  formData.phone
                }
                onChange={
                  handleChange
                }
                required
              />

              <input
                type="text"
                name="nationality"
                placeholder="Nationality"
                value={
                  formData.nationality
                }
                onChange={
                  handleChange
                }
                required
              />


              <h3>
                KYC Verification
              </h3>

              <select
                name="identity_type"
                value={
                  formData.identity_type
                }
                onChange={
                  handleChange
                }
              >

                <option>
                  Passport
                </option>

                <option>
                  Aadhaar
                </option>

                <option>
                  Driving License
                </option>

                <option>
                  Other Government ID
                </option>

              </select>

              <input
                type="text"
                name="identity_number"
                placeholder="Identity / Passport Number"
                value={
                  formData.identity_number
                }
                onChange={
                  handleChange
                }
                required
              />


              <h3>
                Emergency Contact
              </h3>

              <input
                type="text"
                name="emergency_contact_name"
                placeholder="Emergency Contact Name"
                value={
                  formData.emergency_contact_name
                }
                onChange={
                  handleChange
                }
                required
              />

              <input
                type="text"
                name="emergency_contact_phone"
                placeholder="Emergency Contact Phone"
                value={
                  formData.emergency_contact_phone
                }
                onChange={
                  handleChange
                }
                required
              />


              <h3>
                Travel Details
              </h3>

              <input
                type="text"
                name="destination"
                placeholder="Destination (Example: Goa, Hyderabad, Delhi)"
                value={
                  formData.destination
                }
                onChange={
                  handleChange
                }
                required
              />

              <label>
                Entry Date
              </label>

              <input
                type="date"
                name="entry_date"
                value={
                  formData.entry_date
                }
                onChange={
                  handleChange
                }
                required
              />

              <label>
                Exit Date
              </label>

              <input
                type="date"
                name="exit_date"
                value={
                  formData.exit_date
                }
                onChange={
                  handleChange
                }
                required
              />

              <button
                type="submit"
                className="primary-btn register-btn"
                disabled={
                  loading
                }
              >
                {loading
                  ? "Creating Digital ID..."
                  : "Create Secure Digital ID"}
              </button>

            </form>

          </div>


          {/* Digital ID */}

          {tourist && (

            <div className="digital-id">

              <div className="id-header">

                <BadgeCheck
                  size={22}
                />

                <span>
                  SafeTour Digital ID
                </span>

              </div>


              <div className="id-content">

                <h3>
                  {tourist.name}
                </h3>

                <p>
                  <strong>
                    Tourist ID:
                  </strong>{" "}
                  {tourist.id}
                </p>

                <p>
                  <strong>
                    Email:
                  </strong>{" "}
                  {tourist.email}
                </p>

                <p>
                  <strong>
                    Nationality:
                  </strong>{" "}
                  {tourist.nationality}
                </p>

                <p>
                  <strong>
                    Destination:
                  </strong>{" "}
                  {tourist.destination}
                </p>

                <p>
                  <strong>
                    Valid From:
                  </strong>{" "}
                  {tourist.entry_date}
                </p>

                <p>
                  <strong>
                    Valid Until:
                  </strong>{" "}
                  {tourist.exit_date}
                </p>

                <p>
                  <strong>
                    Status:
                  </strong>{" "}
                  {tourist.status}
                </p>

                <hr />

                <h4>
                  Tamper-Protected Record
                </h4>

                <p>
                  <strong>
                    Block Number:
                  </strong>{" "}
                  {tourist.block_number}
                </p>

                <p className="hash-text">

                  <strong>
                    Hash:
                  </strong>

                  <br />

                  {
                    tourist.blockchain_hash
                  }

                </p>

                <button
                  className="verify-btn"
                  onClick={
                    verifyDigitalID
                  }
                  disabled={
                    verificationLoading
                  }
                >

                  <LockKeyhole
                    size={18}
                  />

                  {verificationLoading
                    ? "Verifying..."
                    : "Verify Digital ID"}

                </button>


                {verificationResult && (

                  <div className="verification-result">

                    <h4>
                      {verificationResult.blockchain_verified
                        ? "VERIFIED"
                        : "VERIFICATION FAILED"}
                    </h4>

                    <p>
                      {
                        verificationResult.message
                      }
                    </p>

                  </div>

                )}

              </div>


              <div className="id-footer">
                Verified SafeTour Tourist
              </div>

            </div>

          )}

        </div>

      </section>


      {/* ================================================
          Live Safety Map
      ================================================= */}

      <section
        className="map-section"
        id="safety-map"
      >

        <h2>
          Dynamic Safety Map
        </h2>

        <p>
          Destination-based safety zones with
          real-time location monitoring and
          Geo-Fencing risk detection.
        </p>


        {destinationMessage && (

          <p className="destination-message">
            {destinationMessage}
          </p>

        )}


        {destinationLocation && (

          <div className="destination-card">

            <h3>
              Tourist Destination
            </h3>

            <p>
              <strong>
                Location:
              </strong>{" "}
              {
                destinationLocation.name
              }
            </p>

            <p>
              Dynamic demonstration safety zones
              have been generated around this
              destination.
            </p>

          </div>

        )}


        <div className="tracking-buttons">

          <button
            className="primary-btn location-btn"
            onClick={
              getCurrentLocation
            }
          >

            <MapPin
              size={18}
            />

            Get My Location

          </button>


          {!tracking ? (

            <button
              className="primary-btn tracking-btn"
              onClick={
                startTracking
              }
            >

              <Radar
                size={18}
              />

              Start Live Tracking

            </button>

          ) : (

            <button
              className="stop-tracking-btn"
              onClick={
                stopTracking
              }
            >

              <Square
                size={17}
              />

              Stop Tracking

            </button>

          )}

        </div>


        {tracking && (

          <p className="tracking-status">
            Live location tracking is currently active
          </p>

        )}


        {locationMessage && (

          <p className="location-message">
            {locationMessage}
          </p>

        )}


        {/* Current Location */}

        {location && (

          <div className="location-card">

            <h3>
              Your Current Location
            </h3>

            <p>
              <strong>
                Latitude:
              </strong>{" "}
              {
                location.latitude.toFixed(
                  6
                )
              }
            </p>

            <p>
              <strong>
                Longitude:
              </strong>{" "}
              {
                location.longitude.toFixed(
                  6
                )
              }
            </p>

            <a
              href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="map-link"
            >

              <Map
                size={18}
              />

              Open in Google Maps

            </a>

          </div>

        )}


        {/* Interactive Map */}

        <div className="interactive-map">

          <MapContainer
            center={
              mapCenter
            }
            zoom={
              destinationLocation ||
              location
                ? 13
                : 5
            }
            scrollWheelZoom={
              true
            }
          >

            <MapUpdater
              center={
                mapCenter
              }
            />

            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />


            {/* User Location */}

            {location && (

              <Marker
                position={[
                  location.latitude,
                  location.longitude,
                ]}
              >

                <Popup>

                  <strong>
                    Your Current Location
                  </strong>

                  <br />

                  Latitude:{" "}
                  {
                    location.latitude.toFixed(
                      6
                    )
                  }

                  <br />

                  Longitude:{" "}
                  {
                    location.longitude.toFixed(
                      6
                    )
                  }

                </Popup>

              </Marker>

            )}


            {/* Destination Marker */}

            {destinationLocation && (

              <Marker
                position={[
                  destinationLocation.latitude,
                  destinationLocation.longitude,
                ]}
              >

                <Popup>

                  <strong>
                    Tourist Destination
                  </strong>

                  <br />

                  {
                    destinationLocation.name
                  }

                </Popup>

              </Marker>

            )}


            {/* Dynamic Safety Zones */}

            {safetyZones.map(
              (zone) => (

                <Marker
                  key={
                    zone.name
                  }
                  position={[
                    zone.latitude,
                    zone.longitude,
                  ]}
                >

                  <Popup>

                    <strong>
                      {zone.name}
                    </strong>

                    <br />

                    Risk Level:{" "}
                    {
                      zone.risk
                    }

                    <br />

                    Safety Score:{" "}
                    {
                      zone.score
                    }

                    <br />

                    {
                      zone.message
                    }

                  </Popup>

                </Marker>

              )
            )}


            {/* Geo-Fencing Circles */}

            {safetyZones.map(
              (zone) => {

                const color =
                  getZoneColor(
                    zone.risk
                  );

                return (

                  <Circle
                    key={`circle-${zone.name}`}
                    center={[
                      zone.latitude,
                      zone.longitude,
                    ]}
                    radius={
                      zone.radius
                    }
                    pathOptions={{
                      color,
                      fillColor:
                        color,
                      fillOpacity:
                        0.2,
                    }}
                  />

                );
              }
            )}

          </MapContainer>

        </div>


        {/* Risk Alert */}

        {riskStatus && (

          <div
            className={`risk-alert ${riskStatus.risk
              .toLowerCase()
              .replace(
                " ",
                "-"
              )}`}
          >

            <h3>
              {
                riskStatus.risk
              }
            </h3>

            <p>
              <strong>
                Zone:
              </strong>{" "}
              {
                riskStatus.zone
              }
            </p>

            <p>
              {
                riskStatus.message
              }
            </p>

            <p>
              <strong>
                Safety Score:
              </strong>{" "}
              {
                safetyScore
              }
              /100
            </p>

          </div>

        )}


        {/* Zone Legend */}

        <div className="zone-legend">

          <div className="zone safe-zone">
            Safe Zone
          </div>

          <div className="zone caution-zone">
            Caution Zone
          </div>

          <div className="zone danger-zone">
            High Risk Zone
          </div>

        </div>

      </section>


      {/* ================================================
          Emergency SOS
      ================================================= */}

      <section
        className="sos-section"
        id="emergency"
      >

        <h2>
          Emergency Assistance
        </h2>

        <p>
          Press the SOS button to create an
          emergency incident with your live
          location and emergency contact
          information.
        </p>

        <button
          className="sos-button"
          onClick={
            handleSOS
          }
          disabled={
            sosLoading
          }
        >

          <Siren
            size={35}
          />

          <span>
            {sosLoading
              ? "SENDING"
              : "SOS"}
          </span>

        </button>


        {sosMessage && (

          <p className="sos-message">
            {sosMessage}
          </p>

        )}


        {incident && (

          <div className="incident-card">

            <h3>
              Incident Response Activated
            </h3>

            <p>
              <strong>
                Incident ID:
              </strong>{" "}
              {
                incident.incident_id
              }
            </p>

            <p>
              <strong>
                Tourist:
              </strong>{" "}
              {
                incident.tourist_name
              }
            </p>

            <p>
              <strong>
                Priority:
              </strong>{" "}
              {
                incident.priority
              }
            </p>

            <p>
              <strong>
                Status:
              </strong>{" "}
              {
                incident.status
              }
            </p>

            <p>
              <strong>
                Time:
              </strong>{" "}
              {
                incident.timestamp
              }
            </p>

          </div>

        )}

      </section>


      {/* ================================================
          Features
      ================================================= */}

      <section className="features">


        {/* Digital Tourist ID */}

        <div className="feature-card">

          <div className="feature-icon">
            <BadgeCheck
              size={42}
              strokeWidth={1.8}
            />
          </div>

          <h3>
            Digital Tourist ID
          </h3>

          <p>
            Secure tourist registration with KYC,
            travel details and visit validity.
          </p>

        </div>


        {/* Tamper Protection */}

        <div className="feature-card">

          <div className="feature-icon">
            <ShieldCheck
              size={42}
              strokeWidth={1.8}
            />
          </div>

          <h3>
            Tamper Protection
          </h3>

          <p>
            Blockchain-style hash chaining
            provides tamper-evident Digital ID
            records.
          </p>

        </div>


        {/* AI Safety Score */}

        <div className="feature-card">

          <div className="feature-icon">
            <BrainCircuit
              size={42}
              strokeWidth={1.8}
            />
          </div>

          <h3>
            AI Safety Score
          </h3>

          <p>
            Prototype safety scoring based on
            dynamically generated destination
            safety zones.
          </p>

        </div>


        {/* Live Tracking */}

        <div className="feature-card">

          <div className="feature-icon">
            <MapPin
              size={42}
              strokeWidth={1.8}
            />
          </div>

          <h3>
            Live Tracking
          </h3>

          <p>
            Optional real-time location
            monitoring controlled by the
            tourist.
          </p>

        </div>


        {/* Dynamic Geo-Fencing */}

        <div className="feature-card">

          <div className="feature-icon">
            <Radar
              size={42}
              strokeWidth={1.8}
            />
          </div>

          <h3>
            Dynamic Geo-Fencing
          </h3>

          <p>
            Safety zones are generated
            dynamically around the tourist's
            selected destination.
          </p>

        </div>


        {/* Incident Response */}

        <div className="feature-card">

          <div className="feature-icon">
            <Siren
              size={42}
              strokeWidth={1.8}
            />
          </div>

          <h3>
            Incident Response
          </h3>

          <p>
            SOS alerts create emergency
            incidents with live location.
          </p>

        </div>

      </section>


      {/* ================================================
          Footer
      ================================================= */}

      <footer className="footer">

        <h3>
          SafeTour
        </h3>

        <p>
          Smart Tourist Safety Monitoring &
          Incident Response System
        </p>

        <p>
          AI • Dynamic Geo-Fencing • Digital ID •
          Tamper Protection • Emergency Response
        </p>

      </footer>

    </div>
  );
}

export default App;