import { Box, Skeleton, Stack, Card, CardContent, Grid } from '@mui/material';

/**
 * Loading skeleton for cards
 */
export const CardSkeleton = ({ count = 1 }: { count?: number }) => {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                    <CardContent>
                        <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />
                        <Skeleton variant="rectangular" height={100} sx={{ mb: 1 }} />
                        <Skeleton variant="text" width="40%" />
                    </CardContent>
                </Card>
            ))}
        </>
    );
};

/**
 * Loading skeleton for tables
 */
export const TableSkeleton = ({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) => {
    return (
        <Box sx={{ width: '100%' }}>
            {/* Header */}
            <Stack direction="row" spacing={2} sx={{ mb: 2, p: 2, bgcolor: 'action.hover' }}>
                {Array.from({ length: columns }).map((_, index) => (
                    <Skeleton key={index} variant="text" width={`${100 / columns}%`} height={40} />
                ))}
            </Stack>

            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <Stack key={rowIndex} direction="row" spacing={2} sx={{ mb: 1, p: 2 }}>
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <Skeleton key={colIndex} variant="text" width={`${100 / columns}%`} height={30} />
                    ))}
                </Stack>
            ))}
        </Box>
    );
};

/**
 * Loading skeleton for forms
 */
export const FormSkeleton = ({ fields = 6 }: { fields?: number }) => {
    return (
        <Grid container spacing={3}>
            {Array.from({ length: fields }).map((_, index) => (
                <Grid item xs={12} md={6} key={index}>
                    <Skeleton variant="text" width="30%" height={20} sx={{ mb: 1 }} />
                    <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
                </Grid>
            ))}
            <Grid item xs={12}>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                    <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: 1 }} />
                    <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: 1 }} />
                </Stack>
            </Grid>
        </Grid>
    );
};

/**
 * Loading skeleton for data grid
 */
export const DataGridSkeleton = () => {
    return (
        <Box sx={{ width: '100%', height: 400 }}>
            {/* Toolbar */}
            <Stack direction="row" spacing={2} sx={{ mb: 2, p: 2 }}>
                <Skeleton variant="rectangular" width={200} height={40} />
                <Box sx={{ flexGrow: 1 }} />
                <Skeleton variant="rectangular" width={120} height={40} />
            </Stack>

            {/* Grid */}
            <TableSkeleton rows={8} columns={6} />

            {/* Pagination */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2, p: 2 }}>
                <Skeleton variant="text" width={150} />
                <Stack direction="row" spacing={1}>
                    <Skeleton variant="circular" width={32} height={32} />
                    <Skeleton variant="circular" width={32} height={32} />
                    <Skeleton variant="circular" width={32} height={32} />
                </Stack>
            </Stack>
        </Box>
    );
};

/**
 * Loading skeleton with shimmer effect
 */
export const ShimmerSkeleton = ({
    width = '100%',
    height = 200,
    variant = 'rectangular' as 'text' | 'rectangular' | 'circular'
}) => {
    return (
        <Skeleton
            variant={variant}
            width={width}
            height={height}
            animation="wave"
            sx={{
                bgcolor: 'grey.200',
                '&::after': {
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
                },
            }}
        />
    );
};

/**
 * Page loading skeleton
 */
export const PageSkeleton = () => {
    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <Skeleton variant="circular" width={40} height={40} />
                <Skeleton variant="text" width={200} height={40} />
            </Stack>

            {/* Content */}
            <Card>
                <CardContent>
                    <FormSkeleton fields={8} />
                </CardContent>
            </Card>
        </Box>
    );
};
