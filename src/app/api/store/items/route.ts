import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';
import { getServerUser } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createServiceRoleClient();

    const { data: items, error } = await supabase
      .from('store_items')
      .select(`
        *,
        uploaded_images!image_id (
          id,
          file_url,
          alt_text
        )
      `)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching store items:', error);
      return NextResponse.json({ error: 'Failed to fetch store items' }, { status: 500 });
    }

    return NextResponse.json(items);
  } catch (error) {
    console.error('Store items API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();
    const body = await request.json();
    const user = await getServerUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { name, description, photo_url, image_id, tags, price, stock_quantity } = body;

    const { data: item, error } = await supabase
      .from('store_items')
      .insert({
        name,
        description,
        photo_url: photo_url || null,
        image_id: image_id || null,
        tags,
        price,
        stock_quantity,
        created_by: user.id
      })
      .select(`
        *,
        uploaded_images!image_id (
          id,
          file_url,
          alt_text
        )
      `)
      .single();

    if (error) {
      console.error('Error creating store item:', error);
      return NextResponse.json({ error: 'Failed to create store item' }, { status: 500 });
    }

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Store items POST API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();
    const body = await request.json();
    const user = await getServerUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id, name, description, photo_url, image_id, tags, price, stock_quantity, is_active } = body;

    const { data: item, error } = await supabase
      .from('store_items')
      .update({
        name,
        description,
        photo_url: photo_url || null,
        image_id: image_id || null,
        tags,
        price,
        stock_quantity,
        is_active
      })
      .eq('id', id)
      .select(`
        *,
        uploaded_images!image_id (
          id,
          file_url,
          alt_text
        )
      `)
      .single();

    if (error) {
      console.error('Error updating store item:', error);
      return NextResponse.json({ error: 'Failed to update store item' }, { status: 500 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Store items PUT API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();
    const user = await getServerUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    // Check if item exists and get its details
    const { data: existingItem, error: fetchError } = await supabase
      .from('store_items')
      .select('id, name')
      .eq('id', id)
      .single();

    if (fetchError || !existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Check if item is referenced in any orders
    const { data: orderItems, error: orderCheckError } = await supabase
      .from('store_order_items')
      .select('id')
      .eq('store_item_id', id)
      .limit(1);

    if (orderCheckError) {
      console.error('Error checking order references:', orderCheckError);
      return NextResponse.json({ error: 'Failed to check item references' }, { status: 500 });
    }

    if (orderItems && orderItems.length > 0) {
      // If item is referenced in orders, just mark it as inactive instead of deleting
      const { error: updateError } = await supabase
        .from('store_items')
        .update({ is_active: false })
        .eq('id', id);

      if (updateError) {
        console.error('Error deactivating store item:', updateError);
        return NextResponse.json({ error: 'Failed to deactivate store item' }, { status: 500 });
      }

      return NextResponse.json({
        message: 'Item deactivated successfully (cannot delete due to existing orders)',
        deactivated: true
      });
    } else {
      // Safe to delete if no order references
      const { error: deleteError } = await supabase
        .from('store_items')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Error deleting store item:', deleteError);
        return NextResponse.json({ error: 'Failed to delete store item' }, { status: 500 });
      }

      return NextResponse.json({
        message: 'Item deleted successfully',
        deleted: true
      });
    }
  } catch (error) {
    console.error('Store items DELETE API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}