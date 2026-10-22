import { describe, it, expect } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { failedSearch, isNetworkError } from "./imageProvider";

describe("isNetworkError", () => {
  it("is true for an axios error with no response", () => {
    expect(isNetworkError(new AxiosError("Network Error", "ERR_NETWORK"))).toBe(
      true
    );
  });

  it("is false for an axios error the server answered", () => {
    const error = new AxiosError("Request failed with status code 400");
    error.response = {
      status: 400,
      statusText: "Bad Request",
      data: "",
      headers: {},
      config: { headers: new AxiosHeaders() },
    };
    expect(isNetworkError(error)).toBe(false);
  });

  it("is true for the TypeError fetch throws when the network is down", () => {
    expect(isNetworkError(new TypeError("Failed to fetch"))).toBe(true);
  });

  it("is false for other errors", () => {
    expect(isNetworkError(new Error("something else"))).toBe(false);
    expect(isNetworkError(new TypeError("x is undefined"))).toBe(false);
  });
});

describe("failedSearch", () => {
  it("marks a network failure as offline", () => {
    const result = failedSearch(
      "Openverse",
      new AxiosError("Network Error", "ERR_NETWORK")
    );
    expect(result.images).toEqual([]);
    expect(result.offline).toBe(true);
    expect(result.error).toContain("Openverse");
  });

  it("does not mark other failures as offline", () => {
    const result = failedSearch("Pixabay", new Error("bad key"));
    expect(result.images).toEqual([]);
    expect(result.offline).toBe(false);
    expect(result.error).toContain("bad key");
  });
});
