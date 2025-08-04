create or replace function fetch_blogs()
returns jsonb
language plpgsql
as $$
declare
  result jsonb;
begin

  select jsonb_build_object(
    'blog_id', b.blog_id,
    'blog_title', b.blog_title,
    'blog_content', b.blog_content,
    'excerpt', b.excerpt,
    'image_link', b.image_link,
    'blog_tags', b.blog_tags,
    'blog_status', b.blog_status,
    'created_at', b.created_at,
    'updated_at', b.updated_at,
    'doctor_details', jsonb_build_object(
      'id', s.staff_id,
      'fullname', s.full_name,
      'gender', s.gender,
      'img', `https://xzxxodxplyetecrsbxmc.supabase.co/storage/v1/object/public/blog-uploads/` || s.image_link
    )
  )
  into result
  from blog_posts b
  left join staff_members s on b.doctor_id = s.staff_id
  if result is null then
    raise exception 'Blogs not found';
  end if;
  return result;
end;
$$;