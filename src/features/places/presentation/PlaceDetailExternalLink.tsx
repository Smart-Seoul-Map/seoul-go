import type { ReactElement } from "react";

export type PlaceDetailExternalLinkProps = {
  href: string;
  label: string;
};

export function PlaceDetailExternalLink({
  href,
  label,
}: PlaceDetailExternalLinkProps): ReactElement {
  return (
    <a
      className="PlaceDetailExternalLink"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label} (새 탭에서 열기)`}
      title="새 탭에서 열기"
    >
      {label}
    </a>
  );
}
