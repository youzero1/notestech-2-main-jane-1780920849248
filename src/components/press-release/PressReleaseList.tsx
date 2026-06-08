
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PressRelease } from '@/types/press-release';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

interface PressReleaseListProps {
  pressReleases: PressRelease[];
  onDelete: (id: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const PressReleaseList = ({ 
  pressReleases, 
  onDelete, 
  currentPage, 
  totalPages, 
  onPageChange 
}: PressReleaseListProps) => {
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    
    try {
      await onDelete(deletingId);
      toast({
        title: "Press release deleted",
        description: "The press release has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error deleting press release:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete press release. Please try again.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Generate pagination items
  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Always show the first page
    if (startPage > 1) {
      items.push(
        <PaginationItem key="page-1">
          <PaginationLink onClick={() => onPageChange(1)} isActive={currentPage === 1}>
            1
          </PaginationLink>
        </PaginationItem>
      );

      // Show ellipsis if there's a gap
      if (startPage > 2) {
        items.push(
          <PaginationItem key="ellipsis-1">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }

    // Show numbered pages
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={`page-${i}`}>
          <PaginationLink onClick={() => onPageChange(i)} isActive={currentPage === i}>
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Always show the last page
    if (endPage < totalPages) {
      // Show ellipsis if there's a gap
      if (endPage < totalPages - 1) {
        items.push(
          <PaginationItem key="ellipsis-2">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      items.push(
        <PaginationItem key={`page-${totalPages}`}>
          <PaginationLink onClick={() => onPageChange(totalPages)} isActive={currentPage === totalPages}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Press Releases</CardTitle>
        <Button asChild>
          <Link to="/admin/press-releases/create">
            <Plus className="mr-2 h-4 w-4" /> New Press Release
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pressReleases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  No press releases found. Create your first one!
                </TableCell>
              </TableRow>
            ) : (
              pressReleases.map((pressRelease) => (
                <TableRow key={pressRelease.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {pressRelease.thumbnail_image && (
                        <img
                          src={pressRelease.thumbnail_image}
                          alt={pressRelease.title}
                          className="h-10 w-10 object-cover rounded"
                        />
                      )}
                      <span>{pressRelease.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={pressRelease.status === 'published' ? 'default' : 'secondary'}>
                      {pressRelease.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {pressRelease.created_at ? format(new Date(pressRelease.created_at), 'MMM d, yyyy') : '-'}
                  </TableCell>
                  <TableCell>
                    {pressRelease.updated_at ? format(new Date(pressRelease.updated_at), 'MMM d, yyyy') : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" asChild>
                        <Link to={`/admin/press-releases/edit/${pressRelease.id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="destructive" 
                            size="icon"
                            onClick={() => setDeletingId(pressRelease.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete this
                              press release.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setDeletingId(null)}>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={handleDeleteConfirm}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                
                {renderPaginationItems()}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PressReleaseList;
