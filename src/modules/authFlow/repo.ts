
import { useQuery } from "@tanstack/react-query";
import { getRepositories } from "@/modules/github/action";

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  topics: string[];
  owner: {
    login: string;
  };
}

export function useRepositories(page: number = 1, perPage: number = 10) {
  return useQuery<Repository[]>({
    queryKey: ["repositories", page, perPage],
    queryFn: async () => {
      const data = await getRepositories(page, perPage);
      // Typecast the response to our Repository interface
      return data as Repository[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
