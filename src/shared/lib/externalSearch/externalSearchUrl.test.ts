import { afterEach, describe, expect, test, vi } from "vitest";

import { EXTERNAL_SEARCH_PROVIDER_IDS } from "@shared/constants/externalSearch";

import {
  buildExternalSearchUrl,
  createExternalSearchLinks,
  openExternalSearch,
} from "./externalSearchUrl";

describe("외부 검색 URL", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("제공자별 기본 URL에 검색어를 인코딩해서 붙인다", () => {
    expect(buildExternalSearchUrl("NAVER", "서울숲")).toBe(
      "https://search.naver.com/search.naver?query=%EC%84%9C%EC%9A%B8%EC%88%B2"
    );
    expect(buildExternalSearchUrl("GOOGLE", "서울숲")).toBe(
      "https://www.google.com/search?q=%EC%84%9C%EC%9A%B8%EC%88%B2"
    );
    expect(buildExternalSearchUrl("YOUTUBE", "서울숲")).toBe(
      "https://www.youtube.com/results?search_query=%EC%84%9C%EC%9A%B8%EC%88%B2"
    );
  });

  test("공백과 특수문자가 섞인 검색어도 안전하게 인코딩한다", () => {
    expect(buildExternalSearchUrl("NAVER", " 서울 숲 & 공원 ")).toBe(
      "https://search.naver.com/search.naver?query=%EC%84%9C%EC%9A%B8+%EC%88%B2+%26+%EA%B3%B5%EC%9B%90"
    );
  });

  test("잘못된 유니코드가 섞여도 예외 없이 URL을 만든다", () => {
    expect(() => buildExternalSearchUrl("GOOGLE", "서울\uD800숲")).not.toThrow();
  });

  test("검색어가 비어 있으면 빈 문자열을 돌려준다", () => {
    expect(buildExternalSearchUrl("GOOGLE", "   ")).toBe("");
  });

  test("기본값으로 모든 제공자의 링크를 만든다", () => {
    const links = createExternalSearchLinks("서울숲");

    expect(links.map((link) => link.providerId)).toEqual([...EXTERNAL_SEARCH_PROVIDER_IDS]);
    expect(links[0]).toEqual({
      providerId: "NAVER",
      label: "네이버",
      url: "https://search.naver.com/search.naver?query=%EC%84%9C%EC%9A%B8%EC%88%B2",
    });
  });

  test("제공자를 지정하면 해당 순서대로만 링크를 만든다", () => {
    const links = createExternalSearchLinks("서울숲", ["YOUTUBE", "GOOGLE"]);

    expect(links.map((link) => link.providerId)).toEqual(["YOUTUBE", "GOOGLE"]);
  });

  test("검색어가 없으면 링크를 만들지 않는다", () => {
    expect(createExternalSearchLinks("")).toEqual([]);
  });

  test("새 탭으로 검색 결과를 열고 opener 참조를 끊는다", () => {
    const openedWindow = { opener: window } as unknown as Window;
    const open = vi.spyOn(window, "open").mockReturnValue(openedWindow);

    openExternalSearch("NAVER", "서울숲");

    expect(open).toHaveBeenCalledWith(
      "https://search.naver.com/search.naver?query=%EC%84%9C%EC%9A%B8%EC%88%B2",
      "_blank"
    );
    expect(openedWindow.opener).toBeNull();
  });

  test("브라우저가 팝업을 막아도 예외가 발생하지 않는다", () => {
    vi.spyOn(window, "open").mockReturnValue(null);

    expect(() => openExternalSearch("NAVER", "서울숲")).not.toThrow();
  });

  test("검색어가 없으면 창을 열지 않는다", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);

    openExternalSearch("NAVER", " ");

    expect(open).not.toHaveBeenCalled();
  });
});
