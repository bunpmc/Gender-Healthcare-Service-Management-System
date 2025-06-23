CREATE OR REPLACE FUNCTION create_blog_post(
  p_blog_id UUID,
  p_doctor_id UUID,
  p_blog_title TEXT,
  p_blog_content TEXT,
  p_excerpt TEXT DEFAULT NULL,
  p_image_link TEXT DEFAULT NULL,
  p_blog_tags JSON DEFAULT NULL,
  p_published_at TIMESTAMPTZ DEFAULT NULL,
  p_blog_status blog_status DEFAULT 'draft'
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO blog_posts (
    blog_id,
    doctor_id,
    blog_title,
    blog_content,
    excerpt,
    image_link,
    blog_tags,
    published_at,
    blog_status,
    view_count,
    created_at,
    updated_at
  ) VALUES (
    p_blog_id,
    p_doctor_id,
    p_blog_title,
    p_blog_content,
    p_excerpt,
    p_image_link,
    p_blog_tags,
    p_published_at,
    p_blog_status,
    0,
    NOW(),
    NOW()
  );
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
------------------
CREATE OR REPLACE FUNCTION update_blog_post(
  p_blog_id UUID,
  p_blog_title TEXT DEFAULT NULL,
  p_blog_content TEXT DEFAULT NULL,
  p_excerpt TEXT DEFAULT NULL,
  p_image_link TEXT DEFAULT NULL,
  p_blog_tags JSON DEFAULT NULL,
  p_published_at TIMESTAMPTZ DEFAULT NULL,
  p_blog_status blog_status DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE blog_posts
  SET
    blog_title = COALESCE(p_blog_title, blog_title),
    blog_content = COALESCE(p_blog_content, blog_content),
    excerpt = COALESCE(p_excerpt, excerpt),
    image_link = COALESCE(p_image_link, image_link),
    blog_tags = COALESCE(p_blog_tags, blog_tags),
    published_at = COALESCE(p_published_at, published_at),
    blog_status = COALESCE(p_blog_status, blog_status),
    updated_at = NOW()
  WHERE blog_id = p_blog_id AND blog_status = 'draft';

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;