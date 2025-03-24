'use client';

async function handleChange(onChange, url) {
  try {
    const parsedUrl = new URL(url);
    const key = parsedUrl.pathname.replace(/^\/+/, '');
    onChange();

    const res = await fetch('/api/delete-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    });

    if (!res.ok) throw new Error('Failed to delete file');
    console.log('File deleted!');

  } catch (error) {
    console.error(error);
  }
}

const ChangeButton = (({ url, onChange }) => {
    return (
        <div className="flex flex-col items-center mt-10">
          <button
            onClick={ () => { handleChange(onChange, url) } }
            className="w-50 bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-6 rounded button"
          >
            Change
          </button>
        </div>
      );
})

export default ChangeButton;