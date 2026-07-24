// Máscaras de input para o checkout (Brasil)

const onlyDigits = (v: string) => v.replace(/\D/g, "");

export const maskCPF = (v: string) => {
  const d = onlyDigits(v).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

export const maskPhone = (v: string) => {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 10) {
    return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  }
  return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d{1,4})$/, "$1-$2");
};

export const maskCEP = (v: string) => {
  const d = onlyDigits(v).slice(0, 8);
  return d.replace(/(\d{5})(\d{1,3})$/, "$1-$2");
};

export const maskCard = (v: string) =>
  onlyDigits(v).slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");

export const maskCardExp = (v: string) => {
  const d = onlyDigits(v).slice(0, 4);
  return d.replace(/(\d{2})(\d{1,2})$/, "$1/$2");
};

export const maskCVV = (v: string) => onlyDigits(v).slice(0, 4);

// Validações
export const isValidCPF = (cpf: string): boolean => {
  const d = onlyDigits(cpf);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const calc = (base: number) => {
    let sum = 0;
    for (let i = 0; i < base; i++) sum += parseInt(d[i]) * (base + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === parseInt(d[9]) && calc(10) === parseInt(d[10]);
};

export const isValidCEP = (cep: string) => onlyDigits(cep).length === 8;
export const isValidPhone = (p: string) => {
  const d = onlyDigits(p);
  return d.length >= 10 && d.length <= 11;
};

// ViaCEP
export type CepData = {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
};

export async function fetchCEP(cep: string): Promise<CepData | null> {
  const d = onlyDigits(cep);
  if (d.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${d}/json/`);
    if (!res.ok) return null;
    const data = (await res.json()) as CepData;
    return data.erro ? null : data;
  } catch {
    return null;
  }
}
