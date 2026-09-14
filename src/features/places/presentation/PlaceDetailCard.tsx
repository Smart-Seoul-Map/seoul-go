import { useId, useState, type ReactElement } from "react";
import { AppBox } from "@shared/ui/box";
import { AppHeading, AppText } from "@shared/ui/typography";
import {
  PlaceDetailExternalLink,
  type PlaceDetailExternalLinkProps,
} from "./PlaceDetailExternalLink";
import "./place-detail-card.css";

export type PlaceDetailCardProps = {
  title: string;
  description: string;
  address?: string;
  subtitle?: string;
  image?: { src: string; alt: string };
  externalLink?: PlaceDetailExternalLinkProps;
  showHeader?: boolean;
};

function PlaceImage({ image }: Pick<PlaceDetailCardProps, "image">): ReactElement {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const hasImage = !!image?.src && failedSrc !== image.src;
  return (
    <div className="PlaceDetailCardImage">
      {hasImage ? (
        <img src={image.src} alt={image.alt} onError={() => setFailedSrc(image.src)} />
      ) : (
        <div className="PlaceDetailImageFallback">
          <img src="/images/seoul-characters/hachi.png" alt="" aria-hidden="true" />
          <AppText as="span" role="detailSupporting" tone="muted">
            이미지 준비중
          </AppText>
        </div>
      )}
    </div>
  );
}

export function PlaceDetailCard({
  title,
  description,
  address,
  subtitle = "탐방중 이런 정보를 만나요!",
  image,
  externalLink,
  showHeader = true,
}: PlaceDetailCardProps): ReactElement {
  const titleId = useId();
  return (
    <AppBox
      className="PlaceDetailCard"
      role="region"
      aria-labelledby={showHeader ? titleId : undefined}
      aria-label={showHeader ? undefined : title}
      bg="bg.surfacePaper"
      color="text.default"
      borderColor="stroke.weak"
      borderWidth="strokeWidth.surface"
      borderRadius="radius.7"
      width="var(--sg-detail-width)"
      maxWidth="full"
      py="spacing.7"
      px="spacing.5"
    >
      {showHeader && (
        <header className="PlaceDetailCardHeader">
          <AppHeading as="h2" id={titleId} size="detail">
            {title}
          </AppHeading>
          {subtitle && (
            <AppText role="detailSupporting" tone="muted" align="end">
              {subtitle}
            </AppText>
          )}
        </header>
      )}
      <PlaceImage image={image} />
      <AppBox
        className="PlaceDetailCardDescription"
        bg="bg.surfacePaper"
        color="text.muted"
        borderColor="stroke.weak"
        borderWidth="strokeWidth.surface"
        borderRadius="radius.4_5"
        boxShadow="shadow.raised"
        display="flex"
        alignItems="center"
        minHeight="var(--sg-detail-description-min-height)"
        py="spacing.4"
        px="spacing.5"
        mb="spacing.3_5"
      >
        <AppText role="detailBody" tone="muted">
          {description}
        </AppText>
      </AppBox>
      {address && (
        <AppBox
          className="PlaceDetailCardAddress"
          bg="bg.surfacePaper"
          color="text.muted"
          borderColor="stroke.weak"
          borderWidth="strokeWidth.surface"
          borderRadius="radius.4_5"
          boxShadow="shadow.raised"
          display="flex"
          alignItems="center"
          gap="spacing.5"
          minHeight="var(--sg-detail-address-min-height)"
          py="spacing.5"
          px="spacing.8"
        >
          <svg
            className="PlaceDetailCardLocationIcon"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path
              fill="currentColor"
              fillRule="evenodd"
              d="M12 2a8 8 0 0 0-8 8c0 5 8 12 8 12s8-7 8-12a8 8 0 0 0-8-8Zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z"
            />
          </svg>
          <AppText role="detailSupporting" tone="muted">
            {address}
          </AppText>
        </AppBox>
      )}
      {externalLink && <PlaceDetailExternalLink {...externalLink} />}
    </AppBox>
  );
}
