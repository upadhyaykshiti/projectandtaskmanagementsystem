export const getPagination = (page = 1, limit = 10) => {
  const take = Math.min(Number(limit), 50);
  const skip = (Number(page) - 1) * take;

  return { skip, take };
};

