import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MaterialCard from "../components/MaterialCard/MaterialCard";
import type { Material } from "../constants";

function makeMaterial(overrides: Partial<Material> = {}): Material {
  return {
    id: "m1",
    title: undefined,
    text_content: undefined,
    image_urls: null,
    ...overrides,
  };
}

// ─── Basic rendering ──────────────────────────────────────────────────────────

describe("MaterialCard – basic rendering", () => {
  it('always shows the "Material" label', () => {
    render(<MaterialCard material={makeMaterial()} onZoom={vi.fn()} />);
    expect(screen.getByText("Material")).toBeInTheDocument();
  });

  it("renders title when provided", () => {
    render(
      <MaterialCard
        material={makeMaterial({ title: "Diagram över befolkning" })}
        onZoom={vi.fn()}
      />,
    );
    expect(screen.getByText("Diagram över befolkning")).toBeInTheDocument();
  });

  it("does not render a title element when title is undefined", () => {
    const { container } = render(
      <MaterialCard material={makeMaterial()} onZoom={vi.fn()} />,
    );
    expect(container.querySelector(".material-title")).not.toBeInTheDocument();
  });

  it("renders text_content when provided", () => {
    render(
      <MaterialCard
        material={makeMaterial({ text_content: "Texten handlar om Sverige." })}
        onZoom={vi.fn()}
      />,
    );
    expect(screen.getByText("Texten handlar om Sverige.")).toBeInTheDocument();
  });

  it("does not render text when text_content is undefined", () => {
    const { container } = render(
      <MaterialCard material={makeMaterial()} onZoom={vi.fn()} />,
    );
    expect(container.querySelector(".material-text")).not.toBeInTheDocument();
  });
});

// ─── Image handling ───────────────────────────────────────────────────────────

describe("MaterialCard – images", () => {
  it("renders images when image_urls is an array", () => {
    render(
      <MaterialCard
        material={makeMaterial({
          image_urls: ["http://a.com/1.png", "http://a.com/2.png"],
        })}
        onZoom={vi.fn()}
      />,
    );
    expect(screen.getAllByRole("img")).toHaveLength(2);
  });

  it("renders images when image_urls is a JSON string", () => {
    render(
      <MaterialCard
        material={makeMaterial({
          image_urls: JSON.stringify(["http://a.com/1.png"]),
        })}
        onZoom={vi.fn()}
      />,
    );
    expect(screen.getAllByRole("img")).toHaveLength(1);
  });

  it("shows zoom hint for each image", () => {
    render(
      <MaterialCard
        material={makeMaterial({
          image_urls: ["http://a.com/1.png", "http://a.com/2.png"],
        })}
        onZoom={vi.fn()}
      />,
    );
    expect(screen.getAllByText("Klicka för att zooma")).toHaveLength(2);
  });

  it("does not render image section when image_urls is null", () => {
    const { container } = render(
      <MaterialCard
        material={makeMaterial({ image_urls: null })}
        onZoom={vi.fn()}
      />,
    );
    expect(container.querySelector(".material-imgs")).not.toBeInTheDocument();
  });

  it("calls onZoom with the image URL when an image is clicked", async () => {
    const onZoom = vi.fn();
    render(
      <MaterialCard
        material={makeMaterial({ image_urls: ["http://a.com/fig.png"] })}
        onZoom={onZoom}
      />,
    );
    await userEvent.click(screen.getByRole("img"));
    expect(onZoom).toHaveBeenCalledWith("http://a.com/fig.png");
  });

  it("renders correct alt text for each image", () => {
    render(
      <MaterialCard
        material={makeMaterial({
          image_urls: ["http://a.com/1.png", "http://a.com/2.png"],
        })}
        onZoom={vi.fn()}
      />,
    );
    expect(screen.getByAltText("Material 1")).toBeInTheDocument();
    expect(screen.getByAltText("Material 2")).toBeInTheDocument();
  });
});

// ─── Combined content ─────────────────────────────────────────────────────────

describe("MaterialCard – combined content", () => {
  it("renders title, text, and images together", () => {
    render(
      <MaterialCard
        material={makeMaterial({
          title: "Rubrik",
          text_content: "Brödtext här.",
          image_urls: ["http://a.com/img.png"],
        })}
        onZoom={vi.fn()}
      />,
    );
    expect(screen.getByText("Rubrik")).toBeInTheDocument();
    expect(screen.getByText("Brödtext här.")).toBeInTheDocument();
    expect(screen.getByRole("img")).toBeInTheDocument();
  });
});
