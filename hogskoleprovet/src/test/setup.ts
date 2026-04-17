// Testkonfiguration som körs innan varje testfil.
// Importerar jest-dom vilket lägger till extra matchare (matchers) till Vitest,
// t.ex. toBeInTheDocument(), toBeDisabled(), toHaveAttribute() osv.
// Utan denna import skulle de matcharna inte finnas tillgängliga i testerna.
import "@testing-library/jest-dom";
