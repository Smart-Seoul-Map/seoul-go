import type { DistrictLayer } from "../config/districtMapLayers";

type SeoulDistrictMapProps = {
  activeDistrict: string | null;
  districts: readonly DistrictLayer[];
  selectedDistrict: string | null;
};

export function SeoulDistrictMap({
  activeDistrict,
  districts,
  selectedDistrict,
}: SeoulDistrictMapProps) {
  return (
    <div className="seoul-map-panel">
      <div className="seoul-reference-map" role="img" aria-label="서울 자치구 지도">
        {districts.map((district) => {
          const isActive = activeDistrict === district.name;
          const isSelected = selectedDistrict === district.name;

          return (
            <div
              key={district.id}
              className={`district-region${isActive ? " is-active" : ""}${isSelected ? " is-selected" : ""}`}
              style={{ ...district.layerStyle, backgroundImage: `url(${district.image})` }}
              aria-hidden="true"
            />
          );
        })}
      </div>
    </div>
  );
}
