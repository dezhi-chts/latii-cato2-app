"use client";

import { useEffect, useRef, useState } from "react";
import { GoogleMap, Marker, LoadScriptNext } from "@react-google-maps/api";
import { EnvironmentOutlined } from "@ant-design/icons";
import RequiredHint from "./RequiredHint";

const mapContainerStyle = {
  width: "100%",
  height: "400px",
};

const defaultCenter = {
  lat: 38.9072,
  lng: -77.0369,
};

export type Company = {
  latitude: number;
  longitude: number;
  address: string;
  country: string;
  state: string;
  city: string;
};

type MapProps = {
  name: string;
  required: boolean;
  hint_text?: string;
  value: string;
  onChange?: (value: string) => void;
};

type GmpSelectEvent = Event & {
  placePrediction?: google.maps.places.PlacePrediction;
};

let placeAutocompleteShadowPatched = false;

const patchPlaceAutocompleteShadowDom = () => {
  if (typeof window === "undefined") return;
  if (placeAutocompleteShadowPatched) return;

  const originalAttachShadow = Element.prototype.attachShadow;

  Element.prototype.attachShadow = function (init: ShadowRootInit) {
    if (this.localName === "gmp-place-autocomplete") {
      const shadow = originalAttachShadow.call(this, {
        ...init,
        mode: "open",
      });

      const style = document.createElement("style");

      style.textContent = `
        .widget-container {
          border: none !important;
          background-color: transparent !important;
          width: 100% !important;
        }

        .input-container {
          padding: 4px 0px !important;
          padding-left: 10px !important;
          border: none !important;
          background-color: transparent !important;
          height: 22px !important;
          min-width: 250px !important;
        }

        .focus-ring {
          display: none !important;
        }

        input {
          font-size: 14px !important;
          color: #000000e0 !important;
        }

        input::placeholder {
          color: #00000040 !important;
        }

        .dropdown {
          background-color: white !important;
          color: #111827 !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 8px !important;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1) !important;
          width: 278px !important;
        }

        .autocomplete-icon,
        .clear-button,
        .place-autocomplete-element-place-icon {
          display: none !important;
        }

        li:hover {
          cursor: pointer !important;
          background-color: #f3f4f6 !important;
        }
      `;

      shadow.appendChild(style);
      return shadow;
    }

    return originalAttachShadow.call(this, init);
  };

  placeAutocompleteShadowPatched = true;
};

const GoogleLocation = ({
  name,
  required,
  hint_text = "",
  value,
  onChange,
}: MapProps) => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const [company, setCompany] = useState<Company>({
    latitude: defaultCenter.lat,
    longitude: defaultCenter.lng,
    address: value || "",
    country: "",
    state: "",
    city: "",
  });

  const [marker, setMarker] = useState(defaultCenter);

  const [confirmedValue, setConfirmedValue] = useState(value || "");
  const [draftValue, setDraftValue] = useState(value || "");
  const [resolvedValue, setResolvedValue] = useState<string | null>(null);

  const confirmedValueRef = useRef(value || "");

  const mapRef = useRef<HTMLDivElement | null>(null);
  const autocompleteContainerRef = useRef<HTMLDivElement | null>(null);
  const autocompleteElementRef =
    useRef<google.maps.places.PlaceAutocompleteElement | null>(null);

  useEffect(() => {
    confirmedValueRef.current = confirmedValue || "";
  }, [confirmedValue]);

  useEffect(() => {
    const nextValue = value || "";

    setConfirmedValue(nextValue);
    setDraftValue(nextValue);
    setResolvedValue(null);
    confirmedValueRef.current = nextValue;

    setCompany((prev) => ({ ...prev, address: nextValue }));

    const input =
      autocompleteElementRef.current?.shadowRoot?.querySelector("input");

    if (input) input.value = nextValue;
  }, [value]);

  useEffect(() => {
    if (!company.latitude || !company.longitude) return;

    setMarker({
      lat: company.latitude,
      lng: company.longitude,
    });
  }, [company.latitude, company.longitude]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        mapRef.current &&
        !mapRef.current.contains(target) &&
        autocompleteContainerRef.current &&
        !autocompleteContainerRef.current.contains(target)
      ) {
        setShowMap(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!scriptLoaded || !autocompleteContainerRef.current) return;
    if (autocompleteElementRef.current) return;

    let cancelled = false;

    const init = async () => {
      const { PlaceAutocompleteElement } = (await google.maps.importLibrary(
        "places",
      )) as any;

      patchPlaceAutocompleteShadowDom();

      const el = new PlaceAutocompleteElement();

      if (cancelled) return;

      el.placeholder = hint_text || "Search";
      el.className = "w-full";

      const syncInput = (v: string) => {
        const input = el.shadowRoot?.querySelector("input");
        if (input) input.value = v;
      };

      const handleSelect = async (event: Event) => {
        const { placePrediction } = event as GmpSelectEvent;
        if (!placePrediction) return;

        const place = placePrediction.toPlace();

        await place.fetchFields({
          fields: ["formattedAddress", "location", "addressComponents"],
        });

        if (!place.location) return;

        const address = place.formattedAddress ?? "";

        const coords = {
          lat: place.location.lat(),
          lng: place.location.lng(),
        };

        setCompany((prev) => ({
          ...prev,
          latitude: coords.lat,
          longitude: coords.lng,
          address,
        }));

        setMarker(coords);

        setConfirmedValue(address);
        setDraftValue(address);
        setResolvedValue(address);
        confirmedValueRef.current = address;

        syncInput(address);
        onChange?.(address);

        map?.panTo(coords);
      };

      el.addEventListener("gmp-select", handleSelect);

      if (autocompleteContainerRef.current) {
        autocompleteContainerRef.current.innerHTML = "";
        autocompleteContainerRef.current.appendChild(el);
      }

      autocompleteElementRef.current = el;

      requestAnimationFrame(() => {
        syncInput(value || "");

        const input = el.shadowRoot?.querySelector("input");
        if (!input) return;

        const handleInput = (e: Event) => {
          const t = e.target as HTMLInputElement;
          setDraftValue(t.value);
        };

        const handleBlur = () => {
          const last = confirmedValueRef.current || "";
          syncInput(last);
          setDraftValue(last);
        };

        input.addEventListener("input", handleInput);
        input.addEventListener("blur", handleBlur);
      });
    };

    init();
    return () => {
      cancelled = true;
      autocompleteElementRef.current?.remove();
      autocompleteElementRef.current = null;
    };
  }, [scriptLoaded, hint_text, onChange, value]);

  useEffect(() => {
    if (
      !showMap ||
      !scriptLoaded ||
      !confirmedValue ||
      resolvedValue === confirmedValue
    )
      return;

    const geocoder = new google.maps.Geocoder();

    geocoder.geocode({ address: confirmedValue }, (res, status) => {
      if (status !== "OK" || !res?.[0]) return;

      const loc = res[0].geometry.location;

      const coords = { lat: loc.lat(), lng: loc.lng() };

      setCompany((prev) => ({
        ...prev,
        latitude: coords.lat,
        longitude: coords.lng,
      }));

      setMarker(coords);
      setResolvedValue(confirmedValue);
      map?.panTo(coords);
    });
  }, [showMap, scriptLoaded, confirmedValue, resolvedValue, map]);

  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (!event.latLng) return;

    const coords = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    };

    setMarker(coords);

    const geocoder = new google.maps.Geocoder();

    geocoder.geocode({ location: coords }, (res, status) => {
      if (status === "OK" && res?.[0]) {
        const address = res[0].formatted_address;

        setCompany((prev) => ({
          ...prev,
          latitude: coords.lat,
          longitude: coords.lng,
          address,
        }));

        setConfirmedValue(address);
        setDraftValue(address);
        setResolvedValue(address);
        confirmedValueRef.current = address;

        onChange?.(address);

        const input =
          autocompleteElementRef.current?.shadowRoot?.querySelector("input");
        if (input) input.value = address;
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm">
        {name} {RequiredHint(required)}
      </p>

      <LoadScriptNext
        googleMapsApiKey={apiKey!}
        version="beta"
        onLoad={() => setScriptLoaded(true)}
      >
        <div className="relative w-full">
          <div className="flex group max-w-80">
            <div
              ref={autocompleteContainerRef}
              className="[&>gmp-place-autocomplete]:bg-transparent hover:border-blue-500/80 border border-[#d9d9d9] rounded-l-md w-full group-hover:border-r-blue-500/80"
            />
            <div
              className="!w-9 cursor-pointer justify-center flex border border-[#d9d9d9] rounded-r-md border-l-0 hover:border-blue-500/80"
              onClick={() => setShowMap((prev) => !prev)}
            >
              <EnvironmentOutlined className="text-[#C6C6C6]" />
            </div>
          </div>
          {showMap && (
            <div
              className="absolute top-full left-0 w-full z-50 shadow-xl"
              ref={mapRef}
            >
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={marker}
                zoom={14}
                onLoad={(m) => setMap(m)}
                onClick={handleMapClick}
              >
                <Marker position={marker} />
              </GoogleMap>
            </div>
          )}
        </div>
      </LoadScriptNext>
    </div>
  );
};

export default GoogleLocation;
