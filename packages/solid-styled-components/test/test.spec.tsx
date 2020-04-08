import { createRoot } from "solid-js";
import { styled, ThemeProvider } from "../src/index";

describe("Simple Styled", () => {
  test("Creates component properly", () => {
    const Div = styled<Partial<{ bold: boolean; border: number; color: string }>>("div")`
      color: steelblue;
      font-size: 32px;
      padding: 5px;
      border: ${({ border = 1, color = "gainsboro" }): string => `${border}px solid ${color}`};
      background-color: linen;
      font-weight: ${({ bold = false }): string | number => (bold ? "bold" : 100)};
    `;

    createRoot(() => {
      const v = (
        <Div className="test" bold={true} border={1} color="whitesmoke">
          Testera
        </Div>
      );
    });
  });

  test("Test Theming", () => {
    const Div = styled<Partial<{ bold: boolean; border: number; color: string }>>("div")`
      color: steelblue;
      font-size: 32px;
      padding: 5px;
      border: ${({ border = 1, theme }): string => `${border}px solid ${theme.colors.primary}`};
      background-color: linen;
      font-weight: ${({ bold = false }): string | number => (bold ? "bold" : 100)};
    `;

    createRoot(() => {
      const v = (
        <ThemeProvider
          theme={{
            colors: {
              primary: "hotpink"
            }
          }}
        >
          <Div className="test" bold={true} border={1} color="whitesmoke">
            Testera
          </Div>
        </ThemeProvider>
      );
    });
  });
});
