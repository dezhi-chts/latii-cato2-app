"use client";

import { useEffect, useRef, useState } from "react";
import { GoogleMap, Marker, LoadScriptNext } from "@react-google-maps/api";
import { EnvironmentOutlined } from "@ant-design/icons";

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
  company: Company;
  setCompany: React.Dispatch<React.SetStateAction<Company>>;
};

type GmpSelectEvent = Event & {
  placePrediction?: google.maps.places.PlacePrediction;
};

const GoogleLocation = ({ company, setCompany }: MapProps) => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const initialLocation =
    company.latitude && company.longitude
      ? { lat: company.latitude, lng: company.longitude }
      : defaultCenter;

  const [marker, setMarker] = useState(initialLocation);

  const mapRef = useRef<HTMLDivElement | null>(null);
  const autocompleteContainerRef = useRef<HTMLDivElement | null>(null);
  const autocompleteElementRef =
    useRef<google.maps.places.PlaceAutocompleteElement | null>(null);

  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (!company.latitude || !company.longitude) return;

    setMarker({
      lat: company.latitude,
      lng: company.longitude,
    });
  }, [company.latitude, company.longitude]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mapRef.current && !mapRef.current.contains(event.target as Node)) {
        setShowMap(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!scriptLoaded || !autocompleteContainerRef.current) return;
    if (autocompleteElementRef.current) return;

    let isCancelled = false;

    const initAutocomplete = async () => {
      const { PlaceAutocompleteElement } = (await google.maps.importLibrary(
        "places",
      )) as any;

      const placeAutocomplete = new PlaceAutocompleteElement();

      if (isCancelled || !autocompleteContainerRef.current) return;

      placeAutocomplete.placeholder = "Search";
      placeAutocomplete.className = "w-full";

      const handlePlaceSelect = async (event: Event) => {
        const { placePrediction } = event as GmpSelectEvent;
        if (!placePrediction) return;

        const place = placePrediction.toPlace();

        await place.fetchFields({
          fields: ["formattedAddress", "location", "addressComponents"],
        });

        const location = place.location;
        if (!location) return;

        let country = "";
        let state = "";
        let city = "";

        for (const component of place.addressComponents ?? []) {
          if (component.types.includes("country")) {
            country = component.longText ?? "";
          }

          if (component.types.includes("administrative_area_level_1")) {
            state = component.longText ?? "";
          }

          if (
            component.types.includes("locality") ||
            component.types.includes("postal_town") ||
            component.types.includes("sublocality_level_1")
          ) {
            city = component.longText ?? "";
          }
        }

        const newMarker = {
          lat: location.lat(),
          lng: location.lng(),
        };

        setCompany((prevCompany) => ({
          ...prevCompany,
          latitude: newMarker.lat,
          longitude: newMarker.lng,
          address: place.formattedAddress ?? "",
          country,
          state,
          city,
        }));

        setMarker(newMarker);
        map?.panTo(newMarker);
      };

      placeAutocomplete.addEventListener("gmp-select", handlePlaceSelect);

      autocompleteContainerRef.current.innerHTML = "";
      autocompleteContainerRef.current.appendChild(placeAutocomplete);

      autocompleteElementRef.current = placeAutocomplete;
    };

    initAutocomplete();

    return () => {
      isCancelled = true;

      if (autocompleteElementRef.current) {
        autocompleteElementRef.current.remove();
        autocompleteElementRef.current = null;
      }
    };
  }, [scriptLoaded, map, setCompany]);

  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (!event.latLng) return;

    const newCoords = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    };

    setMarker(newCoords);

    const geocoder = new google.maps.Geocoder();
    const latLngObj = new google.maps.LatLng(newCoords.lat, newCoords.lng);

    geocoder.geocode({ location: latLngObj }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        const address = results[0].formatted_address;

        setCompany((prevCompany) => ({
          ...prevCompany,
          latitude: newCoords.lat,
          longitude: newCoords.lng,
          address,
        }));

        if (autocompleteElementRef.current) {
          (
            autocompleteElementRef.current as google.maps.places.PlaceAutocompleteElement & {
              value: string;
            }
          ).value = address;
        }
      } else {
        setCompany((prevCompany) => ({
          ...prevCompany,
          latitude: newCoords.lat,
          longitude: newCoords.lng,
          address: "Direction not found",
        }));
      }
    });
  };

  return (
    <LoadScriptNext
      googleMapsApiKey={apiKey!}
      version="beta"
      onLoad={() => setScriptLoaded(true)}
    >
      <div className="relative w-fit">
        <div className="flex border rounded">
          <div
            ref={autocompleteContainerRef}
            className="w-full [&>gmp-place-autocomplete]:w-[300px] [&>gmp-place-autocomplete]:min-w-0"
          />

          <div
            className="px-3 cursor-pointer justify-center flex"
            onClick={() => setShowMap((prev) => !prev)}
          >
            <EnvironmentOutlined className="text-[#6b7280]" />
          </div>
        </div>

        <div
          className={`${showMap ? "" : "hidden"} absolute top-full left-0 w-full z-50 shadow-xl`}
          ref={mapRef}
        >
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={marker}
            zoom={14}
            onLoad={(mapInstance: google.maps.Map) => setMap(mapInstance)}
            onClick={handleMapClick}
          >
            <Marker position={marker} />
          </GoogleMap>
        </div>
      </div>
    </LoadScriptNext>
  );
};

export default GoogleLocation;
