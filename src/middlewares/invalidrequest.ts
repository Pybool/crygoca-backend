export const handleInvalidMethod = (req:any, res:any, next:any) => {
    res.status(405).json({ error: 'Method Not Allowed' });
};